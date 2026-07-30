import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const scanRoots = ['tests', 'fixtures'];
const implementationRoots = ['pages', 'components', path.join('tests', 'support')];
const forbiddenSegments = new Set(['components', 'pages']);
const directLocatorMethods = new Set([
  'locator',
  'getByRole',
  'getByText',
  'getByTestId',
  'getByLabel',
  'getByPlaceholder',
  'getByTitle',
]);
const rawNetworkMethods = new Set(['goto', 'route', 'unroute', 'waitForRequest', 'waitForResponse']);
const rawBrowserMethods = new Set(['evaluate', 'goBack', 'goForward', 'reload', 'url', 'on', 'off']);
const forbiddenPlaywrightRuntimeImports = new Set([
  'Browser',
  'BrowserContext',
  'Page',
  'chromium',
  'firefox',
  'request',
  'webkit',
]);
const violations = [];
function usesCentralizedLocatorContract(file) {
  const relative = path.relative(root, file);
  return relative.startsWith(`pages${path.sep}`) || relative.startsWith(`components${path.sep}`);
}

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

for (const implementationRoot of implementationRoots) {
  const files = await collectTypeScriptFiles(path.join(root, implementationRoot));
  for (const file of files) {
    const source = ts.createSourceFile(file, await fs.readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    source.forEachChild((node) => {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return;
      if (!node.moduleSpecifier.text.includes('playwright-logger')) return;
      const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
      violations.push(
        `${path.relative(root, file)}:${line + 1}:${character + 1}: UI code must use @framework/ui instead of playwright-logger directly`,
      );
    });

    const visit = (node) => {
      if (
        usesCentralizedLocatorContract(file) &&
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'expect'
      ) {
        const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
        violations.push(
          `${path.relative(root, file)}:${line + 1}:${character + 1}: UI implementation must use UiExpectations instead of raw expect()`,
        );
      }
      if (
        usesCentralizedLocatorContract(file) &&
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        (node.expression.name.text === 'testId' || node.expression.name.text === 'css') &&
        node.arguments[0] &&
        (ts.isStringLiteral(node.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))
      ) {
        const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
        violations.push(
          `${path.relative(root, file)}:${line + 1}:${character + 1}: UI testId/CSS selector must come from a typed @locators contract`,
        );
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        directLocatorMethods.has(node.expression.name.text)
      ) {
        const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
        violations.push(
          `${path.relative(root, file)}:${line + 1}:${character + 1}: UI implementation must use LocatorFactory instead of "${node.expression.name.text}()"`,
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}

for (const testRoot of [path.join('tests', 'smoke'), path.join('tests', 'regression')]) {
  const files = await collectTypeScriptFiles(path.join(root, testRoot));
  for (const file of files) {
    const source = ts.createSourceFile(file, await fs.readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    source.forEachChild((node) => {
      if (
        !ts.isImportDeclaration(node) ||
        !ts.isStringLiteral(node.moduleSpecifier) ||
        node.moduleSpecifier.text !== '@playwright/test'
      ) {
        return;
      }
      const namedImports = node.importClause?.namedBindings;
      if (!namedImports || !ts.isNamedImports(namedImports)) return;
      for (const element of namedImports.elements) {
        const importedName = element.propertyName?.text ?? element.name.text;
        if (!forbiddenPlaywrightRuntimeImports.has(importedName)) continue;
        const { line, character } = source.getLineAndCharacterOfPosition(element.getStart(source));
        violations.push(
          `${path.relative(root, file)}:${line + 1}:${character + 1}: business tests must use fixtures instead of Playwright runtime "${importedName}"`,
        );
      }
    });
    const visit = (node) => {
      if (ts.isPropertyAccessExpression(node) && node.name.text === 'page') {
        const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
        violations.push(
          `${path.relative(root, file)}:${line + 1}:${character + 1}: business tests must not access a module's raw Page`,
        );
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        directLocatorMethods.has(node.expression.name.text)
      ) {
        const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
        violations.push(
          `${path.relative(root, file)}:${line + 1}:${character + 1}: business tests must use module methods instead of "${node.expression.name.text}()"`,
        );
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        (rawNetworkMethods.has(node.expression.name.text) || rawBrowserMethods.has(node.expression.name.text))
      ) {
        const receiver = node.expression.expression.getText(source);
        if (receiver === 'page' || receiver.endsWith('.page')) {
          const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
          violations.push(
            `${path.relative(root, file)}:${line + 1}:${character + 1}: business tests must use managed fixtures instead of raw page.${node.expression.name.text}()`,
          );
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}

if (violations.length > 0) {
  console.error(['Architecture validation failed:', ...violations.map((item) => `- ${item}`)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    'Architecture validation passed: public modules, locator contracts, managed UI, network, sessions and browser diagnostics are enforced.',
  );
}
