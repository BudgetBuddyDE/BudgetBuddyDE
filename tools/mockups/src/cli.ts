import {access, lstat, mkdir, realpath, rename, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium, type Page} from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const outputRoot = path.resolve(root, process.env.MOCKUPS_OUTPUT_DIR ?? 'artifacts/mockups');
const baseUrl = (process.env.MOCKUPS_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const email = process.env.MOCKUPS_EMAIL;
const password = process.env.MOCKUPS_PASSWORD;
const timeout = Number(process.env.MOCKUPS_TIMEOUT_MS ?? 45_000);
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST ?? 'http://localhost:9000';
const backendOrigin = new URL(backendUrl).origin;

const scenarios = [
  {name: 'dashboard-desktop', path: '/dashboard', width: 1440, height: 1000},
  {name: 'dashboard-mobile', path: '/dashboard', width: 390, height: 844, isMobile: true},
  {name: 'transactions-desktop', path: '/transactions', width: 1440, height: 1000},
  {name: 'budgets-desktop', path: '/dashboard/budget', width: 1440, height: 1000},
] as const;

function requiredCredentials(): void {
  if (!email || !password) {
    throw new Error('Set MOCKUPS_EMAIL and MOCKUPS_PASSWORD for a dedicated demo account.');
  }
}

function validateConfiguration(): void {
  const artifactsRoot = path.resolve(root, 'artifacts');
  const relativeOutput = path.relative(artifactsRoot, outputRoot);
  if (
    !relativeOutput ||
    relativeOutput.startsWith(`..${path.sep}`) ||
    relativeOutput === '..' ||
    path.isAbsolute(relativeOutput)
  ) {
    throw new Error('MOCKUPS_OUTPUT_DIR must be a child directory of the repository artifacts directory.');
  }

  for (const target of [baseUrl, backendUrl]) {
    const url = new URL(target);
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (!['http:', 'https:'].includes(url.protocol) || (!isLocal && url.protocol !== 'https:')) {
      throw new Error('Mockup service URLs must use HTTPS, except for localhost development services.');
    }
  }

  if (new URL(baseUrl).origin === backendOrigin) {
    throw new Error('The webapp and backend must use different origins for browser authentication.');
  }
}

async function validateOutputPath(): Promise<void> {
  const artifactsRoot = path.join(root, 'artifacts');
  await mkdir(artifactsRoot, {recursive: true});
  const realArtifactsRoot = await realpath(artifactsRoot);
  const relativeOutput = path.relative(artifactsRoot, outputRoot);
  let current = artifactsRoot;
  for (const part of relativeOutput.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error('Mockup output path cannot contain symbolic links.');
      if (!info.isDirectory()) throw new Error('Every existing component of MOCKUPS_OUTPUT_DIR must be a directory.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      break;
    }
  }

  const realOutputParent = await realpath(path.dirname(outputRoot));
  if (realOutputParent !== realArtifactsRoot && !realOutputParent.startsWith(`${realArtifactsRoot}${path.sep}`)) {
    throw new Error('Mockup output directory resolves outside the repository artifacts directory.');
  }
}

async function waitForHealthy(page: Page, url: string): Promise<void> {
  await page.waitForFunction(
    async target => {
      try {
        const response = await fetch(target, {method: 'HEAD'});
        return response.ok;
      } catch {
        return false;
      }
    },
    url,
    {timeout},
  );
}

async function signIn(page: Page): Promise<void> {
  await page.goto(`${baseUrl}/sign-in`, {waitUntil: 'domcontentloaded'});
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  const signInResponse = page.waitForResponse(response => response.url() === `${backendUrl}/api/auth/sign-in/email`, {
    timeout,
  });
  await page.getByRole('button', {name: /sign in|anmelden/i}).click();
  const response = await signInResponse;
  if (!response.ok()) throw new Error(`Demo account sign-in failed with HTTP ${response.status()}.`);
  await page.waitForURL(url => url.pathname !== '/sign-in', {timeout});
}

async function waitForPageContent(page: Page): Promise<void> {
  await page.locator('main').waitFor({state: 'visible', timeout});
  await page.waitForFunction(
    () => {
      const main = document.querySelector('main');
      if (!main) return false;
      const text = main.textContent?.trim() ?? '';
      const loaders = main.querySelectorAll('[role="progressbar"], [aria-busy="true"]');
      const visibleLoader = Array.from(loaders).some(element => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      const error = /temporarily unavailable|failed to fetch|something went wrong/i.test(text);
      return text.length > 30 && !visibleLoader && !error;
    },
    undefined,
    {timeout},
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images, image =>
        image.complete
          ? Promise.resolve()
          : new Promise(resolve => {
              image.addEventListener('load', resolve, {once: true});
              image.addEventListener('error', resolve, {once: true});
            }),
      ),
    );
  });
}

async function main(): Promise<void> {
  requiredCredentials();
  validateConfiguration();
  await validateOutputPath();
  const staging = `${outputRoot}.staging-${process.pid}`;
  const previous = `${outputRoot}.previous-${process.pid}`;
  let movedPrevious = false;
  await mkdir(path.dirname(outputRoot), {recursive: true});
  await rm(staging, {recursive: true, force: true});
  const browser = await chromium.launch({headless: true});
  const failures: string[] = [];

  try {
    try {
      const outputStats = await stat(outputRoot);
      if (!outputStats.isDirectory()) throw new Error('MOCKUPS_OUTPUT_DIR must point to a directory.');
      await rm(previous, {recursive: true, force: true});
      await rename(outputRoot, previous);
      movedPrevious = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    const healthPage = await browser.newPage();
    await waitForHealthy(healthPage, `${backendUrl}/health`);
    await healthPage.goto(baseUrl, {waitUntil: 'domcontentloaded', timeout});
    await healthPage.close();

    await mkdir(staging, {recursive: true});
    const context = await browser.newContext({
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
      colorScheme: 'light',
      ignoreHTTPSErrors: new URL(baseUrl).protocol === 'https:' && process.env.MOCKUPS_IGNORE_HTTPS_ERRORS === 'true',
    });
    const authPage = await context.newPage();
    await signIn(authPage);

    for (const scenario of scenarios) {
      const page = await context.newPage();
      await page.setViewportSize({width: scenario.width, height: scenario.height});
      page.on('pageerror', error => failures.push(`${scenario.name}: ${error.message}`));
      page.on('response', response => {
        if (response.url().startsWith(backendOrigin) && response.url().includes('/api/') && response.status() >= 400) {
          failures.push(`${scenario.name}: HTTP ${response.status()} ${response.url()}`);
        }
      });

      await page.goto(`${baseUrl}${scenario.path}`, {waitUntil: 'domcontentloaded', timeout});
      if (new URL(page.url()).pathname === '/sign-in') {
        throw new Error(`Authentication did not persist while opening ${scenario.path}.`);
      }
      await waitForPageContent(page);
      const sessionResponse = await page.request.get(`${backendUrl}/api/me`);
      if (!sessionResponse.ok()) {
        throw new Error(`Backend session is unavailable for ${scenario.path} (HTTP ${sessionResponse.status()}).`);
      }
      await page.screenshot({
        path: path.join(staging, `${scenario.name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await page.close();
    }
    await authPage.close();
    await context.close();

    if (failures.length) throw new Error(failures.join('\n'));

    await writeFile(
      path.join(staging, 'manifest.json'),
      `${JSON.stringify({capturedAt: new Date().toISOString(), baseUrl, scenarios: scenarios.map(({name, path: route, width, height}) => ({name, path: route, width, height}))}, null, 2)}\n`,
    );

    await rename(staging, outputRoot);
    await rm(previous, {recursive: true, force: true});
    movedPrevious = false;
    console.log(`Mockups saved to ${path.relative(root, outputRoot)}`);
  } catch (error) {
    await rm(staging, {recursive: true, force: true});
    if (movedPrevious) {
      try {
        await access(outputRoot);
        await rm(outputRoot, {recursive: true, force: true});
      } catch (restoreError) {
        if ((restoreError as NodeJS.ErrnoException).code !== 'ENOENT') throw restoreError;
      }
      await rename(previous, outputRoot);
    }
    throw error;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

main().catch(error => {
  console.error('Mockup capture failed:', error);
  process.exitCode = 1;
});
