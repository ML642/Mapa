export type CsvDelimiter = ',' | ';' | '\t';

const BOM = '\uFEFF';

const countDelimiterOccurrences = (input: string, delimiter: CsvDelimiter) => {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const current = input[index];

    if (current === '"') {
      if (inQuotes && input[index + 1] === '"') {
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && current === delimiter) {
      count += 1;
    }
  }

  return count;
};

export const detectCsvDelimiter = (input: string): CsvDelimiter => {
  const firstLine = input
    .replace(BOM, '')
    .split(/\r?\n/)
    .find((line) => line.trim().length > 0);

  if (!firstLine) {
    return ',';
  }

  const candidates: CsvDelimiter[] = [',', ';', '\t'];

  return candidates.reduce((best, current) =>
    countDelimiterOccurrences(firstLine, current) > countDelimiterOccurrences(firstLine, best)
      ? current
      : best,
  ',');
};

export const parseCsvRows = (input: string, delimiter: CsvDelimiter = detectCsvDelimiter(input)) => {
  const rows: string[][] = [];
  const source = input.replace(BOM, '');
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];

    if (inQuotes) {
      if (current === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += current;
      }

      continue;
    }

    if (current === '"') {
      inQuotes = true;
      continue;
    }

    if (current === delimiter) {
      row.push(field);
      field = '';
      continue;
    }

    if (current === '\r' || current === '\n') {
      if (current === '\r' && source[index + 1] === '\n') {
        index += 1;
      }

      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += current;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((value) => value.trim().length > 0));
};

export const parseCsvRecords = (input: string) => {
  const rows = parseCsvRows(input);
  const delimiter = detectCsvDelimiter(input);

  if (!rows.length) {
    return {
      delimiter,
      headers: [] as string[],
      records: [] as Array<Record<string, string>>,
    };
  }

  const headerRow = rows[0] ?? [];
  const dataRows = rows.slice(1);
  const headers = headerRow.map((value) => value.trim());
  const records = dataRows.map((dataRow) =>
    headers.reduce<Record<string, string>>((current, header, index) => {
      current[header] = dataRow[index] ?? '';
      return current;
    }, {}),
  );

  return {
    delimiter,
    headers,
    records,
  };
};

const escapeCsvCell = (value: string, delimiter: CsvDelimiter) => {
  if (value.includes('"')) {
    value = value.replaceAll('"', '""');
  }

  if (
    value.includes(delimiter)
    || value.includes('\n')
    || value.includes('\r')
    || value.startsWith(' ')
    || value.endsWith(' ')
  ) {
    return `"${value}"`;
  }

  return value;
};

export const stringifyCsvRows = (rows: Array<Array<string | number | boolean | null | undefined>>, delimiter: CsvDelimiter = ',') =>
  rows
    .map((row) =>
      row
        .map((value) => escapeCsvCell(value === null || value === undefined ? '' : String(value), delimiter))
        .join(delimiter),
    )
    .join('\r\n');
