/* src/utils/csv.ts */
// Minimal RFC 4180 CSV parser/writer: handles quoted fields containing commas,
// escaped quotes ("") and line breaks. Works with files saved from Excel ("CSV UTF-8").

export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // strip Excel's UTF-8 BOM

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }

  // Drop fully blank lines (e.g. trailing newline, empty rows Excel leaves behind)
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
};

const escapeCell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export const toCsv = (rows: string[][]): string =>
  rows.map((r) => r.map(escapeCell).join(',')).join('\r\n');

/** Triggers a browser download of the given CSV rows. */
export const downloadCsv = (filename: string, rows: string[][]) => {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
