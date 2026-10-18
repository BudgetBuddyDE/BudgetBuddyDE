import {readdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import {getMessageKey, getMessageSource} from './config.ts';

const sourceRoot = fileURLToPath(new URL('../../', import.meta.url));
const output = new URL('./messages/en-US.json', import.meta.url);
const messages = new Map();
const dynamicCalls = [];
const check = process.argv.includes('--check');
const configPath = ts.findConfigFile(sourceRoot, ts.sys.fileExists, 'tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();

async function collect(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (filename !== fileURLToPath(new URL('./', import.meta.url)).replace(/\/$/, '')) await collect(filename);
      continue;
    }
    if (!/\.[jt]sx?$/.test(entry.name) || /\.(test|spec)\./.test(entry.name)) continue;
    const source = program.getSourceFile(filename);
    if (!source) continue;
    const translators = new Set(['t']);
    function findTranslators(node) {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const initializer = ts.isAwaitExpression(node.initializer) ? node.initializer.expression : node.initializer;
        if (
          ts.isCallExpression(initializer) &&
          ts.isIdentifier(initializer.expression) &&
          ['useAppTranslations', 'getAppTranslations'].includes(initializer.expression.text)
        ) {
          translators.add(node.name.text);
        }
      }
      ts.forEachChild(node, findTranslators);
    }
    function findMessages(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && translators.has(node.expression.text)) {
        const argument = node.arguments[0];
        if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
          messages.set(getMessageKey(argument.text), argument.text);
        } else if (argument) {
          const type = checker.getTypeAtLocation(argument);
          const types = type.isUnion() ? type.types : [type];
          if (types.every(member => member.isStringLiteral())) {
            for (const member of types) messages.set(getMessageKey(member.value), member.value);
          } else {
            const {line} = source.getLineAndCharacterOfPosition(argument.getStart(source));
            dynamicCalls.push(`${path.relative(sourceRoot, filename)}:${line + 1}: ${argument.getText(source)}`);
          }
        }
      }
      ts.forEachChild(node, findMessages);
    }
    findTranslators(source);
    findMessages(source);
  }
}

await collect(sourceRoot);
if (dynamicCalls.length) {
  console.error('Unverifiable dynamic translation keys; use literal calls or a finite string-literal union:');
  for (const location of dynamicCalls) console.error(`  ${location}`);
}
if (check) {
  const catalog = JSON.parse(await readFile(output, 'utf8'));
  const missing = [...messages.keys()].filter(key => catalog[key] !== messages.get(key));
  const unknown = Object.keys(catalog).filter(key => !messages.has(key));
  const invalid = Object.entries(catalog).filter(([key, value]) => {
    try {
      return getMessageSource(key) !== value;
    } catch {
      return true;
    }
  });
  for (const key of missing) console.error(`Missing or changed catalog message: ${messages.get(key)}`);
  for (const key of unknown) console.error(`Unknown catalog message: ${catalog[key]}`);
  for (const [key] of invalid) console.error(`Invalid English catalog entry: ${key}`);
  if (missing.length || unknown.length || invalid.length || dynamicCalls.length) process.exitCode = 1;
  else console.log(`Checked ${messages.size} English messages.`);
} else {
  await writeFile(
    output,
    `${JSON.stringify(Object.fromEntries([...messages].sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`,
  );
  console.log(`Generated ${messages.size} English messages.`);
}
