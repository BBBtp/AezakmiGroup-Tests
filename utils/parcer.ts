
export function parseCurrency(value: string | null | undefined): number {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
}