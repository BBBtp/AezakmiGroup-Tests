import type { Download, Page, Request, Response, Route } from '@playwright/test';

import type { CleanupRegistry } from '@framework/lifecycle';
import { UiActions } from '@framework/ui';

export type UrlMatcher = string | RegExp | ((url: string) => boolean);

export type ResponseCriteria = {
  url: UrlMatcher;
  method?: string;
  status?: number | ((status: number) => boolean);
  timeout?: number;
};

export type RequestCapture = {
  readonly urls: string[];
  readonly count: number;
  stop(): void;
};

export type HeldRequest = {
  readonly started: Promise<Request>;
  abort(): Promise<void>;
};

export type HeldJsonRequest = HeldRequest & {
  fulfill(body: unknown, status?: number): Promise<void>;
};

function matchesUrl(url: string, matcher: UrlMatcher): boolean {
  if (typeof matcher === 'string') return url.includes(matcher);
  if (matcher instanceof RegExp) return matcher.test(url);
  return matcher(url);
}

function matchesStatus(status: number, expected?: ResponseCriteria['status']): boolean {
  if (expected === undefined) return true;
  return typeof expected === 'number' ? status === expected : expected(status);
}

export class NetworkController {
  private readonly actions: UiActions;
  private captureSequence = 0;

  constructor(
    private readonly page: Page,
    private readonly cleanup?: CleanupRegistry,
  ) {
    this.actions = new UiActions(page);
  }

  navigate(url: string, options?: Parameters<Page['goto']>[1]) {
    return this.actions.navigate(`network navigation to ${url}`, url, options);
  }

  reload(options?: Parameters<Page['reload']>[0]) {
    return this.actions.run('navigate', 'network reload', this.page.locator('body'), () =>
      this.page.reload(options),
    );
  }

  waitForResponse(criteria: ResponseCriteria): Promise<Response> {
    return this.page.waitForResponse(
      (response) =>
        matchesUrl(response.url(), criteria.url) &&
        (!criteria.method || response.request().method() === criteria.method) &&
        matchesStatus(response.status(), criteria.status),
      { timeout: criteria.timeout },
    );
  }

  waitForRequest(criteria: Pick<ResponseCriteria, 'url' | 'method' | 'timeout'>): Promise<Request> {
    return this.page.waitForRequest(
      (request) =>
        matchesUrl(request.url(), criteria.url) && (!criteria.method || request.method() === criteria.method),
      { timeout: criteria.timeout },
    );
  }

  async waitForRequestWhile<T>(
    criteria: Pick<ResponseCriteria, 'url' | 'method' | 'timeout'>,
    action: () => Promise<T>,
  ): Promise<{ request: Request; result: T }> {
    const requestPromise = this.waitForRequest(criteria);
    const [request, result] = await Promise.all([requestPromise, action()]);
    return { request, result };
  }

  async waitForResponseWhile<T>(
    criteria: ResponseCriteria,
    action: () => Promise<T>,
  ): Promise<{ response: Response; result: T }> {
    const responsePromise = this.waitForResponse(criteria);
    const [response, result] = await Promise.all([responsePromise, action()]);
    return { response, result };
  }

  waitForSuccessfulResponse(url: UrlMatcher, method?: string): Promise<Response> {
    return this.waitForResponse({
      url,
      method,
      status: (status) => status >= 200 && status < 300,
    });
  }

  async waitForDownloadWhile<T>(action: () => Promise<T>): Promise<{ download: Download; result: T }> {
    const downloadPromise = this.page.waitForEvent('download');
    const [download, result] = await Promise.all([downloadPromise, action()]);
    return { download, result };
  }

  waitForFailedResponse(url: UrlMatcher, method?: string): Promise<Response> {
    return this.waitForResponse({
      url,
      method,
      status: (status) => status >= 500,
    });
  }

  async failNext(url: string | RegExp, method: string, body: unknown, status = 500): Promise<void> {
    const handler = async (route: Route) => {
      if (route.request().method() !== method) {
        await route.continue();
        return;
      }

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };

    await this.page.route(url, handler, { times: 1 });
  }

  async fulfillNextJson(url: string | RegExp, method: string, body: unknown, status = 200): Promise<void> {
    const handler = async (route: Route) => {
      if (route.request().method() !== method) {
        await route.continue();
        return;
      }

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };

    await this.page.route(url, handler, { times: 1 });
  }

  async mockJson(url: string | RegExp, method: string, body: unknown, status = 200): Promise<void> {
    const handler = async (route: Route) => {
      if (route.request().method() !== method) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };
    await this.page.route(url, handler);
  }

  async fulfillNextMutation(url: string | RegExp, body: unknown, status = 200): Promise<void> {
    const handler = async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };
    await this.page.route(url, handler, { times: 1 });
  }

  async fulfillJsonSequence(
    url: string | RegExp,
    method: string,
    bodies: readonly unknown[],
    status = 200,
  ): Promise<void> {
    if (bodies.length === 0) throw new Error('JSON response sequence must not be empty');
    let index = 0;
    const handler = async (route: Route) => {
      if (route.request().method() !== method) {
        await route.continue();
        return;
      }

      const body = bodies[index];
      index += 1;
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };

    await this.page.route(url, handler, { times: bodies.length });
  }

  async fulfillNextSse(
    url: string | RegExp,
    method: string,
    event: string,
    data: unknown,
    status = 200,
  ): Promise<void> {
    const handler = async (route: Route) => {
      if (route.request().method() !== method) {
        await route.continue();
        return;
      }

      await route.fulfill({
        status,
        contentType: 'text/event-stream',
        headers: { 'cache-control': 'no-cache' },
        body: `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      });
    };

    await this.page.route(url, handler, { times: 1 });
  }

  async holdNext(url: string | RegExp, method: string): Promise<HeldRequest> {
    let resolveStarted: (request: Request) => void = () => {};
    const started = new Promise<Request>((resolve) => {
      resolveStarted = resolve;
    });
    let resolveRelease: () => void = () => {};
    const release = new Promise<void>((resolve) => {
      resolveRelease = resolve;
    });
    let heldRoute: Route | undefined;
    let active = true;

    const handler = async (route: Route) => {
      if (route.request().method() !== method) {
        await route.continue();
        return;
      }

      heldRoute = route;
      resolveStarted(route.request());
      await release;
      if (!active) return;
      active = false;
      await route.abort('aborted').catch(() => {});
    };

    await this.page.route(url, handler, { times: 1 });
    const abort = async () => {
      if (!active) return;
      active = false;
      resolveRelease();
      await heldRoute?.abort('aborted').catch(() => {});
    };
    const cleanupHandle = this.cleanup?.register('held network request', abort);

    return {
      started,
      abort: async () => {
        await abort();
        cleanupHandle?.dismiss();
      },
    };
  }

  async holdNextMutation(url: string | RegExp): Promise<HeldRequest> {
    let resolveStarted: (request: Request) => void = () => {};
    const started = new Promise<Request>((resolve) => {
      resolveStarted = resolve;
    });
    let heldRoute: Route | undefined;
    let active = true;
    const handler = async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.continue();
        return;
      }
      heldRoute = route;
      resolveStarted(route.request());
    };
    await this.page.route(url, handler, { times: 1 });
    const abort = async () => {
      if (!active) return;
      active = false;
      await heldRoute?.abort('aborted').catch(() => {});
    };
    const cleanupHandle = this.cleanup?.register('held mutation request', abort);
    return {
      started,
      abort: async () => {
        await abort();
        cleanupHandle?.dismiss();
      },
    };
  }

  async holdNextJson(url: string | RegExp, method: string): Promise<HeldJsonRequest> {
    let resolveStarted: (request: Request) => void = () => {};
    const started = new Promise<Request>((resolve) => {
      resolveStarted = resolve;
    });
    let heldRoute: Route | undefined;
    let active = true;
    const handler = async (route: Route) => {
      if (route.request().method() !== method) {
        await route.continue();
        return;
      }
      heldRoute = route;
      resolveStarted(route.request());
    };
    await this.page.route(url, handler, { times: 1 });

    const finish = async (operation: 'abort' | 'fulfill', body?: unknown, status = 200) => {
      if (!active) return;
      active = false;
      if (operation === 'fulfill') {
        await heldRoute?.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      } else {
        await heldRoute?.abort('aborted').catch(() => {});
      }
    };
    const cleanupHandle = this.cleanup?.register('held JSON request', () => finish('abort'));

    return {
      started,
      fulfill: async (body, status = 200) => {
        await finish('fulfill', body, status);
        cleanupHandle?.dismiss();
      },
      abort: async () => {
        await finish('abort');
        cleanupHandle?.dismiss();
      },
    };
  }

  async waitForRequestFailedWhile<T>(
    criteria: Pick<ResponseCriteria, 'url' | 'method' | 'timeout'>,
    action: () => Promise<T>,
  ): Promise<{ request: Request; result: T }> {
    const requestPromise = this.page.waitForEvent('requestfailed', {
      predicate: (request) =>
        matchesUrl(request.url(), criteria.url) && (!criteria.method || request.method() === criteria.method),
      timeout: criteria.timeout,
    });
    const [request, result] = await Promise.all([requestPromise, action()]);
    return { request, result };
  }

  captureRequests(predicate: (request: Request) => boolean): RequestCapture {
    const urls: string[] = [];
    let active = true;
    const listener = (request: Request) => {
      if (predicate(request)) urls.push(request.url());
    };
    this.page.on('request', listener);
    this.captureSequence += 1;
    const cleanupHandle = this.cleanup?.register(`request capture #${this.captureSequence}`, () => {
      if (!active) return;
      this.page.off('request', listener);
      active = false;
    });

    return {
      urls,
      get count() {
        return urls.length;
      },
      stop: () => {
        if (!active) return;
        this.page.off('request', listener);
        active = false;
        cleanupHandle?.dismiss();
      },
    };
  }
}
