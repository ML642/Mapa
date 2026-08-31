import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const fixtureUrl = new URL('../../backend/test.events.DB.json', import.meta.url);
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

const roundPercent = (value) => Number(value.toFixed(2));

const source = await readFile(eventCardOverviewUrl, 'utf8');
const { getPhoneItems } = await loadTypescriptSource(`
${extractConstDeclaration(source, 'normalizePhoneItem')}
${extractConstDeclaration(source, 'getPhoneItems')}
export { getPhoneItems };
`);

const loadBackendEventsFixture = async () => JSON.parse(await readFile(fixtureUrl, 'utf8'));

test('reports backend phone coverage and unconnected phone percentage', async (t) => {
  const events = await loadBackendEventsFixture();
  assert.ok(Array.isArray(events), 'backend events fixture should be an array');
  assert.ok(events.length > 0, 'backend events fixture should contain events');

  const stats = {
    totalEvents: events.length,
    connectedPhoneEvents: 0,
    unconnectedPhoneEvents: 0,
    missingPhoneEvents: 0,
    invalidProvidedPhoneEvents: 0,
    totalClickablePhoneLinks: 0,
    invalidProvidedPhoneExamples: [],
  };

  for (const event of events) {
    const backendPhone = typeof event.phone === 'string' ? event.phone.trim() : '';
    const frontendPhones = getPhoneItems(backendPhone);
    const hasConnectedPhone = frontendPhones.length > 0;

    if (hasConnectedPhone) {
      stats.connectedPhoneEvents += 1;
      stats.totalClickablePhoneLinks += frontendPhones.length;
      continue;
    }

    stats.unconnectedPhoneEvents += 1;

    if (!backendPhone) {
      stats.missingPhoneEvents += 1;
      continue;
    }

    stats.invalidProvidedPhoneEvents += 1;

    if (stats.invalidProvidedPhoneExamples.length < 10) {
      stats.invalidProvidedPhoneExamples.push({
        id: event._id?.$oid ?? event._id ?? null,
        title: event.title ?? '',
        backendPhone,
      });
    }
  }

  const connectedPhonePercent = roundPercent((stats.connectedPhoneEvents / stats.totalEvents) * 100);
  const unconnectedPhonePercent = roundPercent((stats.unconnectedPhoneEvents / stats.totalEvents) * 100);
  const missingPhonePercent = roundPercent((stats.missingPhoneEvents / stats.totalEvents) * 100);
  const invalidProvidedPhonePercent = roundPercent((stats.invalidProvidedPhoneEvents / stats.totalEvents) * 100);

  const report = {
    ...stats,
    connectedPhonePercent,
    unconnectedPhonePercent,
    missingPhonePercent,
    invalidProvidedPhonePercent,
  };

  t.diagnostic(`backend phone coverage report:\n${JSON.stringify(report, null, 2)}`);

  const maxUnconnectedPhonePercent = Number(process.env.MAX_UNCONNECTED_PHONE_PERCENT ?? 100);
  assert.ok(
    unconnectedPhonePercent <= maxUnconnectedPhonePercent,
    `unconnected phone percent ${unconnectedPhonePercent}% exceeds MAX_UNCONNECTED_PHONE_PERCENT=${maxUnconnectedPhonePercent}%`,
  );
});
