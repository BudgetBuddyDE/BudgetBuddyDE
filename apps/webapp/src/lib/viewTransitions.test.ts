import {afterEach, describe, expect, it, vi} from 'vite-plus/test';
import {registerPageTransition, waitForPageTransitions} from './viewTransitions';

const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
};

describe('waitForPageTransitions', () => {
  const finishes: Array<() => void> = [];
  const start = () => {
    const finish = registerPageTransition();
    finishes.push(finish);
    return finish;
  };

  afterEach(() => {
    finishes.splice(0).forEach(finish => finish());
    Reflect.deleteProperty(document, 'activeViewTransition');
  });

  it('resolves immediately when the browser has no active transition API', async () => {
    await expect(waitForPageTransitions()).resolves.toBeUndefined();
  });

  it('waits for every registered boundary', async () => {
    const finishFirst = start();
    const finishSecond = start();
    const settled = vi.fn();
    const waiting = waitForPageTransitions().then(settled);
    finishFirst();
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    finishSecond();
    await waiting;
    expect(settled).toHaveBeenCalledOnce();
  });

  it('also waits for the native transition when no boundary is registered', async () => {
    const transition = deferred();
    Object.defineProperty(document, 'activeViewTransition', {
      configurable: true,
      value: {finished: transition.promise},
    });
    const settled = vi.fn();
    const waiting = waitForPageTransitions().then(settled);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    transition.resolve();
    await waiting;
    expect(settled).toHaveBeenCalledOnce();
  });

  it('releases the waiter when a skipped native transition rejects', async () => {
    const transition = deferred();
    Object.defineProperty(document, 'activeViewTransition', {
      configurable: true,
      value: {finished: transition.promise},
    });
    const waiting = waitForPageTransitions();
    transition.reject(new Error('Transition skipped'));
    await expect(waiting).resolves.toBeUndefined();
  });

  it('waits for a new transition that starts before the previous one finishes', async () => {
    const finishFirst = start();
    const settled = vi.fn();
    const waiting = waitForPageTransitions().then(settled);
    const finishSecond = start();
    finishFirst();
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    finishSecond();
    await waiting;
    expect(settled).toHaveBeenCalledOnce();
  });

  it('releases an aborted waiter without waiting for the animation', async () => {
    start();
    const controller = new AbortController();
    const waiting = waitForPageTransitions(controller.signal);
    controller.abort();
    await expect(waiting).resolves.toBeUndefined();
  });

  it('does not wait when the signal is already aborted', async () => {
    start();
    const controller = new AbortController();
    controller.abort();
    await expect(waitForPageTransitions(controller.signal)).resolves.toBeUndefined();
  });
});
