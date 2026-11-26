import ts from 'typescript';
import {defineConfig} from 'vite-plus';

/**
 * Keep passing tests quiet and replay their console output only when a test
 * fails. Project containers also set this explicitly because the reporter reads
 * `silent` from the root config, not from the child projects.
 */
export const silentConsole = 'passed-only' as const;

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
    // Concurrent Turbo runners must not prune each other's transformed modules.
    fsModuleCachePath: `${process.cwd()}/node_modules/.vitest-cache`,
    globals: true,
    // Keep passing tests quiet and replay their console output only when a test
    // fails. Workspaces that declare `test.projects` must also set `silent` on
    // the container, because the reporter reads it from the root config.
    silent: silentConsole,
    // Reuse the transformed module graph across test files in a worker. Projects
    // whose suites intentionally reset modules or exercise real infrastructure
    // must override this with their own isolated project.
    isolate: false,
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
