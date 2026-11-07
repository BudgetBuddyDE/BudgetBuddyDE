import {defineRailway, project, service} from 'railway/iac';

const sharedWatchPatterns = ['/packages/**', '/package.json', '/pnpm-lock.yaml', '/pnpm-workspace.yaml', '/turbo.json'];

const region = {'europe-west4-drams3a': {numReplicas: 1}};

// Service names are placeholders until compared with the target Railway environment.
export default defineRailway(ctx => {
  if (!ctx.projectName) {
    throw new Error('Link a Railway project before evaluating this configuration.');
  }

  const webapp = service('webapp', {
    build: {
      builder: 'RAILPACK',
      buildCommand: 'vp install --frozen-lockfile && pnpm exec turbo run build --filter=@budgetbuddyde/webapp',
      watchPatterns: ['/apps/webapp/**', ...sharedWatchPatterns],
      buildEnvironment: 'V3',
    },
    deploy: {
      runtime: 'V2',
      numReplicas: 1,
      startCommand: 'pnpm --filter=@budgetbuddyde/webapp start',
      healthcheckPath: '/api/health',
      healthcheckTimeout: 15,
      sleepApplication: false,
      multiRegionConfig: region,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 1,
    },
  });

  const backend = service('backend', {
    build: {
      builder: 'RAILPACK',
      buildCommand: 'vp install --frozen-lockfile && pnpm exec turbo run build --filter=@budgetbuddyde/backend',
      watchPatterns: ['/services/backend/**', ...sharedWatchPatterns],
      buildEnvironment: 'V3',
    },
    deploy: {
      runtime: 'V2',
      numReplicas: 1,
      startCommand: 'pnpm --filter=@budgetbuddyde/backend start',
      healthcheckPath: '/health',
      healthcheckTimeout: 15,
      sleepApplication: false,
      multiRegionConfig: region,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 1,
    },
  });

  const website = service('website', {
    build: {builder: 'RAILPACK', watchPatterns: ['/apps/website/**']},
    deploy: {
      runtime: 'V2',
      numReplicas: 1,
      sleepApplication: true,
      multiRegionConfig: region,
      restartPolicyType: 'ALWAYS',
    },
  });

  return project(ctx.projectName, {resources: [webapp, backend, website]});
});
