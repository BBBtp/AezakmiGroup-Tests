import type { Page, Request, Response, Route } from '@playwright/test';

import { UiActions } from '@framework/ui';

export type UrlMatcher = string | RegExp | ((url: string) => boolean);

export type ResponseCriteria = {
  url: UrlMatcher;
  method?: string;
  status?: number | ((status: number) => boolean);
};

export type RequestCapture = {
  readonly urls: string[];
  stop(): void;
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

  constructor(readonly page: Page) {
    this.actions = new UiActions(page);
  }

  forPage(page: Page): NetworkController {
    return new NetworkController(page);
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
    );
  }

  waitForSuccessfulResponse(url: UrlMatcher, method?: string): Promise<Response> {
    return this.waitForResponse({
      url,
      method,
      status: (status) => status >= 200 && status < 300,
    });
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

  captureRequests(predicate: (request: Request) => boolean): RequestCapture {
    const urls: string[] = [];
    const listener = (request: Request) => {
      if (predicate(request)) urls.push(request.url());
    };
    this.page.on('request', listener);

    return {
      urls,
      stop: () => this.page.off('request', listener),
    };
  }
}
