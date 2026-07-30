import { requireTestId } from '@utils/test-id';

function baseTestId(value: string, context: string): string {
  return requireTestId(value, context);
}

export const commonComponentSelectors = {
  card: (value: string) => {
    const base = baseTestId(value, 'CardComponent');

    return {
      root: base,
      title: `${base}__title`,
      mainValue: `[data-testid^="${base}__"][data-testid$="currency"], [data-testid$="main"]`,
      absoluteValue: `${base}__abs`,
      percentageValue: `${base}__percentage-value`,
      period: `${base}__period`,
    };
  },
  modal: (value: string) => ({
    root: baseTestId(value, 'ModalComponent'),
    close: '[data-testid$="__close"], [aria-label="Close"], [aria-label="close"], button:has-text("Close")',
    title: '.modal-title, h2, h3',
  }),
} as const;
