import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const scanRoots = ['tests', 'fixtures'];
const forbiddenSegments = new Set(['components', 'pages']);
const violations = [];

async function collectTypeScriptFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectTypeScriptFiles(entryPath)));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(entryPath);
  }

  return files;
}

function isForbiddenImport(importer, specifier) {
  if (specifier.startsWith('@pages/') || specifier.startsWith('@components/')) return true;
  if (!specifier.startsWith('.')) return false;

  const resolved = path.resolve(path.dirname(importer), specifier);
  const relative = path.relative(root, resolved);
  return relative.split(path.sep).some((segment) => forbiddenSegments.has(segment));
}

for (const scanRoot of scanRoots) {
  const files = await collectTypeScriptFiles(path.join(root, scanRoot));

  for (const file of files) {
    const source = ts.createSourceFile(file, await fs.readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);

    source.forEachChild((node) => {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return;
      const specifier = node.moduleSpecifier.text;
      if (!isForbiddenImport(file, specifier)) return;

      const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
      violations.push(
        `${path.relative(root, file)}:${line + 1}:${character + 1}: import "${specifier}" bypasses @modules/*`,
      );
    });
  }
}

if (violations.length > 0) {
  console.error(['Architecture validation failed:', ...violations.map((item) => `- ${item}`)].join('\n'));
  process.exitCode = 1;
} else {
  console.log('Architecture validation passed: tests and fixtures use public domain modules.');
}
