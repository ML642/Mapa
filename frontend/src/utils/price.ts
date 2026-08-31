const CURRENCY_LABEL = 'BYN';
const RUB_LABEL = 'RUB';
const MONEY_RANGE_PATTERN = /(от\s+)?(\d+(?:[\s\u00A0]\d{3})*(?:[,.]\d{1,2})?)\s*[–—-]\s*(\d+(?:[\s\u00A0]\d{3})*(?:[,.]\d{1,2})?)\s*(руб(?:\.|лей|ля|ль)?|byn)(?![a-zа-яё])/giu;
const MONEY_AMOUNT_PATTERN = /(от\s+)?(\d+(?:[\s\u00A0]\d{3})*(?:[,.]\d{1,2})?)\s*(руб(?:\.|лей|ля|ль)?|byn)(?![a-zа-яё])/giu;

const isFreePriceValue = (value: string) => {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
    return /^0(?:\.0+)?$/.test(normalized);
};

const looksLikeFreePriceText = (value: string) => {
    return /(бесплат|свобод|безоплат|вольн)/i.test(value);
};

const normalizePriceText = (value: string) => value.replace(/\s+/g, ' ').replace(/\s*([–—-])\s*/g, ' — ');

const looksLikeSimplePriceText = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
        return false;
    }

    const lower = trimmed.toLowerCase();

    if (
        lower.includes('бесплат') ||
        lower.includes('свобод') ||
        lower.includes('преми') ||
        lower.includes('руб') ||
        lower.includes('byn') ||
        lower.includes('за') ||
        lower.includes('чек')
    ) {
        return false;
    }

    return /^([<>]?|от\s+)?[\d,.\s–—-]+$/.test(trimmed);
};

const normalizeMoneyAmountText = (value: string) => value.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').replace(',', '.');

const parseMoneyAmount = (value: string) => {
    const normalized = value.replace(/[\s\u00A0]/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

const getCurrencyLabel = (value: string) => value.toLowerCase() === 'byn' ? CURRENCY_LABEL : RUB_LABEL;

type CompactMoneyMatch = {
    value: number;
    label: string;
    currency: string;
    hasFromPrefix: boolean;
};

const buildCompactMoneyMatch = (amount: string, currency: string, hasFromPrefix = false): CompactMoneyMatch | null => {
    const parsed = parseMoneyAmount(amount);

    if (parsed === null) {
        return null;
    }

    return {
        value: parsed,
        label: normalizeMoneyAmountText(amount),
        currency: getCurrencyLabel(currency),
        hasFromPrefix,
    };
};

const formatCompactPriceDescription = (value: string) => {
    const rangeMatches = Array.from(value.matchAll(MONEY_RANGE_PATTERN))
        .flatMap((match) => [
            buildCompactMoneyMatch(match[2], match[4], Boolean(match[1])),
            buildCompactMoneyMatch(match[3], match[4]),
        ]);
    const amountMatches = Array.from(value.matchAll(MONEY_AMOUNT_PATTERN))
        .map((match) => {
            const amount = match[2];
            const currency = match[3];
            return buildCompactMoneyMatch(amount, currency, Boolean(match[1]));
        });
    const matches = [...rangeMatches, ...amountMatches]
        .filter((match): match is CompactMoneyMatch => Boolean(match));

    if (matches.length === 0) {
        return null;
    }

    const uniqueMatches = Array.from(new Map(matches.map((match) => [match.value, match])).values());
    const sortedMatches = [...uniqueMatches].sort((a, b) => a.value - b.value);
    const minPrice = sortedMatches[0];
    const maxPrice = sortedMatches[sortedMatches.length - 1];
    const currency = minPrice.currency;

    if (minPrice.value === maxPrice.value) {
        return `${minPrice.hasFromPrefix ? 'from ' : ''}${minPrice.label} ${currency}`;
    }

    return `${minPrice.label} — ${maxPrice.label} ${currency}`;
};

const formatBasePriceLabel = (price?: string | number | null, isPremium?: boolean) => {
    if (typeof price === 'number' && Number.isFinite(price)) {
        if (price === 0) {
            return 'Free';
        }

        return `${price.toLocaleString('en-GB')} ${CURRENCY_LABEL}`;
    }

    if (typeof price === 'string') {
        const trimmed = price.trim();

        if (!trimmed) {
            return isPremium ? 'Premium' : 'Free';
        }

        if (isFreePriceValue(trimmed)) {
            return 'Free';
        }

        const compactDescription = formatCompactPriceDescription(trimmed);

        if (compactDescription) {
            return compactDescription;
        }

        if (looksLikeFreePriceText(trimmed)) {
            return 'Free';
        }

        if (looksLikeSimplePriceText(trimmed)) {
            return `${normalizePriceText(trimmed)} ${CURRENCY_LABEL}`;
        }

        return trimmed;
    }

    return isPremium ? 'Premium' : 'Free';
};

export const formatEventPreviewPriceLabel = ({
    price,
    priceDescription,
    isPremium,
}: {
    price?: string | number | null;
    priceDescription?: string | null;
    isPremium?: boolean;
}) => {
    const description = priceDescription?.toString().trim();

    if (description) {
        if (isFreePriceValue(description)) {
            return 'Free';
        }

        const compactDescription = formatCompactPriceDescription(description);

        if (compactDescription) {
            return compactDescription;
        }

        if (looksLikeFreePriceText(description)) {
            return 'Free';
        }

        if (looksLikeSimplePriceText(description)) {
            return `${normalizePriceText(description)} ${CURRENCY_LABEL}`;
        }
    }

    return formatBasePriceLabel(price, isPremium);
};

export const formatEventPriceLabel = ({
    price,
    priceDescription,
    isPremium,
}: {
    price?: string | number | null;
    priceDescription?: string | null;
    isPremium?: boolean;
}) => {
    const description = priceDescription?.toString().trim();

    if (description) {
        if (isFreePriceValue(description)) {
            return 'Free';
        }

        if (looksLikeSimplePriceText(description)) {
            return `${normalizePriceText(description)} ${CURRENCY_LABEL}`;
        }

        return description;
    }

    return formatBasePriceLabel(price, isPremium);
};
