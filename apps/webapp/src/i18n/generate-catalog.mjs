import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, URL} from 'node:url';
import process from 'node:process';
import ts from 'typescript';
import {parse} from '@formatjs/icu-messageformat-parser';

const i18nRoot = fileURLToPath(new URL('./', import.meta.url));
const messageRoot = path.join(i18nRoot, 'messages');
const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const catalogs = new Map();
const failures = [];

async function readFragments(locale, directory = path.join(messageRoot, locale), prefix = '') {
  const result = {};
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await readFragments(locale, filename, `${prefix}${entry.name}.`));
    else if (entry.name.endsWith('.json')) {
      const domain = `${prefix}${entry.name.slice(0, -5)}`;
      const parsed = JSON.parse(await readFile(filename, 'utf8'));
      result[domain] = parsed;
    }
  }
  return result;
}

function flatten(value, prefix = '', result = new Map()) {
  for (const [key, item] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof item === 'string') result.set(fullKey, item);
    else if (item && typeof item === 'object' && !Array.isArray(item)) flatten(item, fullKey, result);
    else failures.push(`Catalog value must be a string or object: ${fullKey}`);
  }
  return result;
}

for (const locale of ['en-US', 'de-DE']) {
  const fragments = await readFragments(locale);
  catalogs.set(locale, flatten(fragments));
}

const english = catalogs.get('en-US');
const german = catalogs.get('de-DE');
for (const [key, message] of english) {
  if (!message.trim()) failures.push(`Empty English message: ${key}`);
  if (!german.has(key)) failures.push(`Missing German message: ${key}`);
}
for (const [key, message] of german) {
  if (!message.trim()) failures.push(`Empty German message: ${key}`);
  if (!english.has(key)) failures.push(`Unknown German message: ${key}`);
}

function placeholders(message, key, locale) {
  try {
    const ast = parse(message, {captureLocation: false});
    const names = new Set();
    function visit(nodes) {
      for (const node of nodes) {
        if ('value' in node && node.type !== 0) names.add(node.value);
        if ('options' in node) for (const option of Object.values(node.options)) visit(option.value);
      }
    }
    visit(ast);
    return [...names].sort().join(',');
  } catch (error) {
    failures.push(`Invalid ${locale} ICU message ${key}: ${error.message}`);
    return '';
  }
}
for (const [key, message] of english) {
  if (!german.has(key)) continue;
  const enNames = placeholders(message, key, 'English');
  const deNames = placeholders(german.get(key), key, 'German');
  if (enNames !== deNames)
    failures.push(`ICU placeholders differ for ${key}: English [${enNames}], German [${deNames}]`);
}

const configPath = ts.findConfigFile(sourceRoot, ts.sys.fileExists, 'tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();
const validKeys = new Set(english.keys());
const helperNames = new Set(['useAppTranslations', 'getAppTranslations']);
for (const source of program.getSourceFiles()) {
  const filename = source.fileName;
  if (!filename.startsWith(sourceRoot) || filename.includes('/node_modules/') || /\.(test|spec)\./.test(filename))
    continue;
  const translatorSymbols = new Set();
  function findBindings(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      let initializer = node.initializer;
      if (ts.isAwaitExpression(initializer)) initializer = initializer.expression;
      if (
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression) &&
        helperNames.has(initializer.expression.text)
      ) {
        const symbol = checker.getSymbolAtLocation(node.name);
        if (symbol) translatorSymbols.add(symbol);
      }
    }
    ts.forEachChild(node, findBindings);
  }
  findBindings(source);
  function checkCalls(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      translatorSymbols.has(checker.getSymbolAtLocation(node.expression))
    ) {
      const arg = node.arguments[0];
      if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
        if (!validKeys.has(arg.text)) {
          const {line} = source.getLineAndCharacterOfPosition(arg.getStart(source));
          failures.push(`${path.relative(sourceRoot, filename)}:${line + 1}: unknown translation key ${arg.text}`);
        }
      } else if (arg) {
        const type = checker.getTypeAtLocation(arg);
        const members = type.isUnion() ? type.types : [type];
        const stringMembers =
          type.isUnion() && members.every(member => (member.flags & ts.TypeFlags.StringLiteral) !== 0);
        if (!stringMembers) {
          const {line} = source.getLineAndCharacterOfPosition(arg.getStart(source));
          failures.push(
            `${path.relative(sourceRoot, filename)}:${line + 1}: translation key must be literal or finite string union`,
          );
        } else {
          for (const member of members)
            if (!validKeys.has(member.value))
              failures.push(`${path.relative(sourceRoot, filename)}: unknown translation key ${member.value}`);
        }
      }
    }
    ts.forEachChild(node, checkCalls);
  }
  checkCalls(source);
}

if (failures.length) {
  for (const failure of failures) globalThis.console.error(failure);
  process.exitCode = 1;
} else globalThis.console.log(`Checked ${english.size} semantic messages in English and German.`);
