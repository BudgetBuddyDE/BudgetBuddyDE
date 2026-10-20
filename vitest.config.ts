import ts from 'typescript';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'standard-decorators',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('.ts') || !code.includes('@log')) return;
        // Oxc does not lower standard decorators; use the existing TypeScript compiler.
        const result = ts.transpileModule(code, {
          fileName: id,
          compilerOptions: {target: ts.ScriptTarget.ES2019, module: ts.ModuleKind.ESNext, sourceMap: true},
        });
        return {code: result.outputText, map: result.sourceMapText};
      },
    },
  ],
  test: {
    globals: true,
    silent: 'passed-only',
    environment: 'node',
    exclude: ['**/build/**', '**/node_modules/**'],
    coverage: {
      enabled: false,
      exclude: ['vitest.config.ts', 'build/**', 'lib/**', '**/index.ts'],
    },
    // root: __dirname,
    // projects: ['packages/*'],
  },
});
