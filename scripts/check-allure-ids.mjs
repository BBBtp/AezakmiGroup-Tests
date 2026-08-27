import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');

if (!configPath) {
  throw new Error('tsconfig.json was not found');
}

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();
const specFiles = program
  .getSourceFiles()
  .filter((sourceFile) => !sourceFile.isDeclarationFile && /\.spec\.ts$/.test(sourceFile.fileName));

const errors = [];
const tests = [];
const ids = new Map();

function location(sourceFile, node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${path.relative(root, sourceFile.fileName)}:${line + 1}:${character + 1}`;
}

function resolveSymbol(node) {
  let symbol = checker.getSymbolAtLocation(node);
  if (symbol && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  return symbol;
}

function evaluateString(node, seen = new Set()) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;

  if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
    const symbolNode = ts.isPropertyAccessExpression(node) ? node.name : node;
    const symbol = resolveSymbol(symbolNode);
    if (!symbol || seen.has(symbol)) return null;
    seen.add(symbol);

    for (const declaration of symbol.declarations ?? []) {
      if (
        (ts.isVariableDeclaration(declaration) ||
          ts.isPropertyAssignment(declaration) ||
          ts.isPropertyDeclaration(declaration)) &&
        declaration.initializer
      ) {
        const value = evaluateString(declaration.initializer, seen);
        if (value !== null) return value;
      }
    }
  }

  return null;
}

function isTestCall(node) {
  if (!ts.isCallExpression(node)) return false;
  if (ts.isIdentifier(node.expression)) return node.expression.text === 'test';
  if (
    !ts.isPropertyAccessExpression(node.expression) ||
    !ts.isIdentifier(node.expression.expression) ||
    node.expression.expression.text !== 'test'
  ) {
    return false;
  }
  if (node.expression.name.text === 'only') return true;
  if (!['skip', 'fixme'].includes(node.expression.name.text)) return false;
  return node.arguments.some((argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument));
}

function isAllureIdCall(node) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === 'allure' &&
    node.expression.name.text === 'allureId'
  );
}

for (const sourceFile of specFiles) {
  function visit(node) {
    if (isTestCall(node)) {
      const title = node.arguments[0] && evaluateString(node.arguments[0]);
      const callback = [...node.arguments]
        .reverse()
        .find((argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument));
      const allureCalls = [];

      if (callback) {
        function findAllureCalls(child) {
          if (isAllureIdCall(child)) allureCalls.push(child);
          ts.forEachChild(child, findAllureCalls);
        }
        ts.forEachChild(callback.body, findAllureCalls);
      }

      const testLocation = location(sourceFile, node);
      tests.push({ title: title ?? '<dynamic title>', location: testLocation });

      if (allureCalls.length !== 1) {
        errors.push(`${testLocation}: expected exactly one allure.allureId(), found ${allureCalls.length}`);
      } else {
        const argument = allureCalls[0].arguments[0];
        const id = argument ? evaluateString(argument) : null;

        if (!id || !/^\d+$/.test(id)) {
          errors.push(`${location(sourceFile, allureCalls[0])}: Allure ID must resolve to a numeric string`);
        } else {
          const titleId = title?.match(/^\[TC-(\d+)\]\s+/u)?.[1];
          if (!titleId) {
            errors.push(`${testLocation}: title must start with [TC-${id}]`);
          } else if (titleId !== id) {
            errors.push(`${testLocation}: title TC-${titleId} does not match Allure ID ${id}`);
          }
          const previous = ids.get(id);
          if (previous) {
            errors.push(`${testLocation}: duplicate Allure ID ${id}; first used at ${previous}`);
          } else {
            ids.set(id, testLocation);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

if (tests.length === 0) {
  errors.push('No Playwright tests were discovered');
}

if (errors.length > 0) {
  console.error(['Allure ID validation failed:', ...errors.map((error) => `- ${error}`)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Allure ID validation passed: ${tests.length} tests, ${ids.size} unique IDs.`);
}
