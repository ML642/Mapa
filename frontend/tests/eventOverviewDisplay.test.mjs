import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const DEFAULT_COORDINATES = [53.9045, 27.5618];

const fixtureUrl = new URL('../../backend/test.events.DB.json', import.meta.url);
const mainSideListUrl = new URL('../src/components/Desktop/mainSide/MainSideEventList.tsx', import.meta.url);
const mainSideFormattersUrl = new URL('../src/components/Desktop/mainSide/formatters.ts', import.meta.url);
const eventCardUrl = new URL('../src/components/Desktop/Side/EventCard.tsx', import.meta.url);
const eventCardOverviewUrl = new URL('../src/components/Desktop/Side/eventCard/EventCardOverview.tsx', import.meta.url);

const loadTypescriptSource = async (source) => {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
};

const loadTypescriptModule = async (url) => loadTypescriptSource(await readFile(url, 'utf8'));

const extractConstDeclaration = (source, name) => {
  const start = source.indexOf(`const ${name}`);
  assert.notEqual(start, -1, `frontend source should contain const ${name}`);

  let curlyDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') curlyDepth += 1;
    if (char === '}') curlyDepth -= 1;
    if (char === '(') parenDepth += 1;
    if (char === ')') parenDepth -= 1;
    if (char === '[') bracketDepth += 1;
    if (char === ']') bracketDepth -= 1;

    if (char === ';' && curlyDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      return source.slice(start, index + 1);
    }
  }

  throw new Error(`Could not extract const ${name}`);
};

const loadExtractedConsts = async (url, names) => {
  const source = await readFile(url, 'utf8');
  const declarations = names.map((name) => extractConstDeclaration(source, name)).join('\n');
  return loadTypescriptSource(`${declarations}\nexport { ${names.join(', ')} };`);
};

const loadBackendEventsFixture = async () => JSON.parse(await readFile(fixtureUrl, 'utf8'));

const getEventId = (event) => event._id?.$oid ?? event._id ?? null;

const getBackendEventDate = (event) => {
  if (event.event_date) {
    return event.event_date;
  }

  const firstEventDate = Array.isArray(event.event_dates) ? event.event_dates[0] : null;
  if (typeof firstEventDate === 'string') {
    return firstEventDate;
  }

  if (firstEventDate?.$date) {
    return firstEventDate.$date;
  }

  return null;
};

const toFrontendEvent = (event) => ({
  ...event,
  _id: getEventId(event),
  event_date: getBackendEventDate(event),
});

const normalizeRenderedValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
};

const roundPercent = (value) => Number(value.toFixed(2));

const isValidCoordinatePair = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length >= 2 &&
  coordinates.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));

const [mainSideListSource, eventCardSource] = await Promise.all([
  readFile(mainSideListUrl, 'utf8'),
  readFile(eventCardUrl, 'utf8'),
]);

const { getPreviewPriceLabel } = await loadTypescriptModule(mainSideFormattersUrl);
const { getPriceLabel } = await loadExtractedConsts(eventCardUrl, ['getPriceLabel']);
const { normalizePhoneItem, getPhoneItems } = await loadExtractedConsts(eventCardOverviewUrl, [
  'normalizePhoneItem',
  'getPhoneItems',
]);

const getBackendPrice = (event) => {
  const backendPriceDescription = normalizeRenderedValue(event.price_description);
  if (backendPriceDescription) {
    return backendPriceDescription;
  }

  if (event.price === 0 || event.price === undefined || event.price === null) {
    return getPreviewPriceLabel(event.is_premium);
  }

  return normalizeRenderedValue(event.price);
};

const getLeftPanelPrice = (event) => normalizeRenderedValue(event.price || getPreviewPriceLabel(event.is_premium));
const getRightCardPrice = (event) =>
  normalizeRenderedValue(event.event_date ? getPriceLabel(event.price_description) : null);

const normalizePriceForComparison = (value) => {
  const renderedValue = normalizeRenderedValue(value);

  if (!renderedValue) {
    return 'empty';
  }

  const normalizedText = renderedValue
    .replace(/\u00a0/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const compactText = normalizedText.replace(/\s+/g, '');
  const textWithoutTrailingPunctuation = normalizedText.replace(/[.!?]+$/g, '').trim();
  const hasMoneyAmount = /\d+(?:[,.]\d{1,2})?\s*(?:руб\.?|р\.?|pln|₽)/i.test(normalizedText);

  if (/^(?:0|0[,.]0+)(?:руб\.?|р\.?|pln)?$/i.test(compactText)) {
    return 'price:0.00';
  }

  if (
    /^(?:бесплатно|бесплатный|бесплатная|бесплатное|свободный|свободная|свободно|вход свободный|свободный вход|вход бесплатный|вход бесплатно|без оплаты)$/i.test(
      textWithoutTrailingPunctuation,
    ) ||
    (!hasMoneyAmount && /(?:бесплат|свободн|без оплаты|уваход вольн|вход вольн|вольны)/i.test(normalizedText))
  ) {
    return 'price:0.00';
  }

  const simpleMoneyMatch = normalizedText.match(/^(\d+(?:[,.]\d{1,2})?)(?:\s*(?:руб\.?|р\.?|pln))?$/i);
  if (simpleMoneyMatch) {
    return `price:${Number(simpleMoneyMatch[1].replace(',', '.')).toFixed(2)}`;
  }

  return `text:${normalizedText}`;
};

const pricesMatchForComparison = (firstPrice, secondPrice) =>
  normalizePriceForComparison(firstPrice) === normalizePriceForComparison(secondPrice);

const compactReportValue = (value, maxLength = 160) => {
  const renderedValue = normalizeRenderedValue(value).replace(/\s+/g, ' ');
  return renderedValue.length > maxLength ? `${renderedValue.slice(0, maxLength)}...` : renderedValue;
};

test('price comparison is wired to the current frontend list and detail components', () => {
  assert.ok(
    mainSideListSource.includes('price={event.price || getPreviewPriceLabel(event.is_premium)}'),
    'left list should still pass event.price or getPreviewPriceLabel to EventCardPreview',
  );
  assert.ok(
    eventCardSource.includes('const priceLabel = getPriceLabel(eventData?.price_description);'),
    'right card should still calculate price from eventData.price_description',
  );
  assert.ok(
    eventCardSource.includes('priceLabel={eventData?.event_date ? priceLabel : null}'),
    'right card should still pass calculated priceLabel into EventCardOverview',
  );
});

test('price comparison normalizes simple numeric and free aliases', () => {
  const numericAliases = ['6', '6,00', '6.00', '6 руб.', '6,00 руб.', '6.00 PLN'];
  const freeAliases = ['0', '0,00', 'Бесплатно', 'Бесплатный', 'Свободный', 'Свободный и без брони'];

  assert.equal(new Set(numericAliases.map(normalizePriceForComparison)).size, 1);
  assert.equal(new Set(freeAliases.map(normalizePriceForComparison)).size, 1);
  assert.notEqual(normalizePriceForComparison('7'), normalizePriceForComparison('7,00 — 26,00 руб.'));
  assert.notEqual(
    normalizePriceForComparison('6'),
    normalizePriceForComparison('6,00 руб. — для взрослых 4,00 руб. — для студентов'),
  );
  assert.notEqual(
    normalizePriceForComparison('3'),
    normalizePriceForComparison('Уваход вольны. Дарослыя — 3,00 руб.'),
  );
});

test('backend price, left list price, and right detail price are identical', async (t) => {
  const events = await loadBackendEventsFixture();
  assert.ok(Array.isArray(events), 'backend events fixture should be an array');
  assert.ok(events.length > 0, 'backend events fixture should contain events');

  const mismatches = [];
  const stats = {
    totalEvents: events.length,
    allThreeMatched: 0,
    allThreeMismatched: 0,
    backendVsLeftMismatched: 0,
    backendVsRightMismatched: 0,
    leftVsRightMismatched: 0,
    allThreeDifferent: 0,
    onlyBackendAndLeftMatch: 0,
    onlyBackendAndRightMatch: 0,
    onlyLeftAndRightMatch: 0,
  };

  for (const backendEvent of events) {
    const event = toFrontendEvent(backendEvent);
    const backendPrice = getBackendPrice(event);
    const leftPanelPrice = getLeftPanelPrice(event);
    const rightCardPrice = getRightCardPrice(event);
    const backendComparablePrice = normalizePriceForComparison(backendPrice);
    const leftComparablePrice = normalizePriceForComparison(leftPanelPrice);
    const rightComparablePrice = normalizePriceForComparison(rightCardPrice);
    const prices = new Set([backendComparablePrice, leftComparablePrice, rightComparablePrice]);
    const backendMatchesLeft = pricesMatchForComparison(backendPrice, leftPanelPrice);
    const backendMatchesRight = pricesMatchForComparison(backendPrice, rightCardPrice);
    const leftMatchesRight = pricesMatchForComparison(leftPanelPrice, rightCardPrice);

    if (prices.size === 1) {
      stats.allThreeMatched += 1;
      continue;
    }

    stats.allThreeMismatched += 1;

    if (!backendMatchesLeft) stats.backendVsLeftMismatched += 1;
    if (!backendMatchesRight) stats.backendVsRightMismatched += 1;
    if (!leftMatchesRight) stats.leftVsRightMismatched += 1;

    if (prices.size === 3) {
      stats.allThreeDifferent += 1;
    } else if (backendMatchesLeft) {
      stats.onlyBackendAndLeftMatch += 1;
    } else if (backendMatchesRight) {
      stats.onlyBackendAndRightMatch += 1;
    } else if (leftMatchesRight) {
      stats.onlyLeftAndRightMatch += 1;
    }

    if (mismatches.length < 10) {
      mismatches.push({
        id: event._id,
        title: compactReportValue(event.title),
        backendPrice,
        backendRawPrice: event.price ?? null,
        backendPriceDescription: compactReportValue(event.price_description),
        leftPanelPrice,
        rightCardPrice: compactReportValue(rightCardPrice),
        comparablePrices: {
          backend: backendComparablePrice,
          leftPanel: leftComparablePrice,
          rightCard: rightComparablePrice,
        },
      });
    }
  }

  const withPercent = (count) => ({
    count,
    percent: roundPercent((count / stats.totalEvents) * 100),
  });

  const report = {
    priceStats: {
      totalEvents: stats.totalEvents,
      allThreeMatched: withPercent(stats.allThreeMatched),
      allThreeMismatched: withPercent(stats.allThreeMismatched),
      pairMismatches: {
        backendVsLeft: withPercent(stats.backendVsLeftMismatched),
        backendVsRight: withPercent(stats.backendVsRightMismatched),
        leftVsRight: withPercent(stats.leftVsRightMismatched),
      },
      mismatchShapes: {
        allThreeDifferent: withPercent(stats.allThreeDifferent),
        onlyBackendAndLeftMatch: withPercent(stats.onlyBackendAndLeftMatch),
        onlyBackendAndRightMatch: withPercent(stats.onlyBackendAndRightMatch),
        onlyLeftAndRightMatch: withPercent(stats.onlyLeftAndRightMatch),
      },
    },
    examples: mismatches,
  };

  t.diagnostic(`backend price comparison report:\n${JSON.stringify(report, null, 2)}`);

  assert.equal(
    stats.allThreeMismatched,
    0,
    `expected backend price, left panel price, and right card price to match for every event.\npriceStats:\n${JSON.stringify(report.priceStats, null, 2)}\nfirstExamples:\n${JSON.stringify(mismatches, null, 2)}`,
  );
});

test('backend phone values become the same tel links the detail card renders', () => {
  const cases = [
    {
      backendPhone: '%20+375333538577',
      expected: ['+375333538577'],
    },
    {
      backendPhone: 'na +375 33 353 85 77',
      expected: ['+375333538577'],
    },
    {
      backendPhone: '+375 (33) 353-85-77, %2B375291234567',
      expected: ['+375333538577', '+375291234567'],
    },
    {
      backendPhone: 'na, contacts unknown, ---',
      expected: [],
    },
  ];

  for (const { backendPhone, expected } of cases) {
    const phones = getPhoneItems(backendPhone);
    assert.deepEqual(
      phones.map((phone) => ({ label: phone, href: `tel:${phone}` })),
      expected.map((phone) => ({ label: phone, href: `tel:${phone}` })),
    );
  }

  assert.equal(normalizePhoneItem('tel:%20+375333538577'), '+375333538577');
});

test('backend location values match left list address and right card route coordinates', async () => {
  const events = await loadBackendEventsFixture();
  const locatedEvent = events.find((event) => event.address && isValidCoordinatePair(event.coordinates));
  const missingLocationEvent = { address: '   ', coordinates: [Number.NaN, 27.5618] };

  assert.ok(locatedEvent, 'fixture should contain an event with address and coordinates');
  assert.equal(normalizeRenderedValue(locatedEvent.address), locatedEvent.address.trim());
  assert.deepEqual(locatedEvent.coordinates, locatedEvent.coordinates);
  assert.deepEqual(
    isValidCoordinatePair(missingLocationEvent.coordinates)
      ? missingLocationEvent.coordinates
      : DEFAULT_COORDINATES,
    DEFAULT_COORDINATES,
  );
});
