export type SubscriptionMetric = {
  total: number;
  absolute: number;
  percentage: number;
};

export const subscriptionMetricKeys = [
  'total_subscriptions',
  'total_one_time_purchases',
  'total_intros',
  'total_intros_converted',
  'total_trials',
  'total_trials_converted',
  'total_revenue',
] as const;

export type SubscriptionAppOptions = {
  appId: string;
  appName: string;
  appleId: string;
  productId: string;
  totals: readonly [number, number, number, number, number, number, number];
  geos?: readonly string[];
};

function metricsFrom(totals: SubscriptionAppOptions['totals']) {
  return Object.fromEntries(
    subscriptionMetricKeys.map((key, index) => [
      key,
      { total: totals[index], absolute: totals[index], percentage: 100 },
    ]),
  ) as Record<(typeof subscriptionMetricKeys)[number], SubscriptionMetric>;
}

export function subscriptionApp(options: SubscriptionAppOptions) {
  const metrics = metricsFrom(options.totals);
  return {
    apphud_app_id: options.appId,
    app_name: options.appName,
    apple_id: options.appleId,
    icon_url: null,
    rows: (options.geos ?? ['US']).map((geo, index) => ({
      geo,
      ...metrics,
      products: [
        {
          product_id: index === 0 ? options.productId : `${options.productId}.${geo.toLowerCase()}`,
          count: index + 1,
          revenue: options.totals[6],
        },
      ],
    })),
  };
}

export function subscriptionTableResponse(options: SubscriptionAppOptions) {
  const metrics = metricsFrom(options.totals);

  return {
    total_count: 1,
    summary: metrics,
    data: [subscriptionApp(options)],
  };
}

export function subscriptionTableForApps(apps: readonly SubscriptionAppOptions[], totalCount = apps.length) {
  if (apps.length === 0) {
    return {
      total_count: 0,
      summary: metricsFrom([0, 0, 0, 0, 0, 0, 0]),
      data: [],
    };
  }
  return {
    total_count: totalCount,
    summary: metricsFrom(apps[0].totals),
    data: apps.map(subscriptionApp),
  };
}

export function subscriptionChartResponse(dates = ['2026-08-05', '2026-08-06', '2026-08-07']) {
  return {
    series: Object.fromEntries(
      subscriptionMetricKeys.map((key, metricIndex) => [
        key,
        Object.fromEntries(dates.map((date, dateIndex) => [date, (metricIndex + 1) * 100 + dateIndex])),
      ]),
    ),
  };
}
