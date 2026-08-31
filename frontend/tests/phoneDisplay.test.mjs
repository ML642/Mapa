import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

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

const source = await readFile(eventCardOverviewUrl, 'utf8');
const phoneModule = await loadTypescriptSource(`
${extractConstDeclaration(source, 'normalizePhoneItem')}
${extractConstDeclaration(source, 'getPhoneItems')}
export { getPhoneItems };
`);

const toDisplayItems = (backendPhone) =>
  phoneModule.getPhoneItems(backendPhone).map((phone) => ({
    label: phone,
    href: `tel:${phone}`,
  }));

test('phone contacts display exactly normalized backend payloads', () => {
  const cases = [
    {
      name: 'encoded leading space from backend',
      backendPhone: '%20+375333538577',
      expectedDisplay: [{ label: '+375333538577', href: 'tel:+375333538577' }],
    },
    {
      name: 'bad text prefix before Belarus phone',
      backendPhone: 'na +375 33 353 85 77',
      expectedDisplay: [{ label: '+375333538577', href: 'tel:+375333538577' }],
    },
    {
      name: 'formatted phone and encoded plus',
      backendPhone: '+375 (33) 353-85-77, %2B375291234567',
      expectedDisplay: [
        { label: '+375333538577', href: 'tel:+375333538577' },
        { label: '+375291234567', href: 'tel:+375291234567' },
      ],
    },
    {
      name: 'duplicate representations collapse to one displayed phone',
      backendPhone: '+375333538577, +375 (33) 353-85-77',
      expectedDisplay: [{ label: '+375333538577', href: 'tel:+375333538577' }],
    },
    {
      name: 'non-phone backend text is hidden',
      backendPhone: 'na, contacts unknown, ---',
      expectedDisplay: [],
    },
  ];

  for (const { name, backendPhone, expectedDisplay } of cases) {
    assert.deepEqual(
      toDisplayItems(backendPhone),
      expectedDisplay,
      `${name}: backend phone "${backendPhone}" should match displayed contacts`,
    );
  }
});
