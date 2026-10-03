'use strict';
const fields = ['TRANSACTION_DATE', 'DESCRIPTION', 'AMOUNT', 'CATEGORY', 'ACCOUNT_NAME', 'ACCOUNT_TYPE', 'TRANSACTION_TYPE'];
function key(row) {
  return JSON.stringify([String(row.TRANSACTION_DATE).slice(0, 10), row.DESCRIPTION.trim(), Math.round(Number(row.AMOUNT) * 100), row.ACCOUNT_NAME, row.TRANSACTION_TYPE]);
}
async function allRows(table) {
  const rows = []; let nextToken;
  do {
    const page = await table.getPagedRows({ maxRows: 100, nextToken });
    rows.push(...page.data); nextToken = page.next_token;
  } while (nextToken);
  return rows;
}
async function importTransactions(table, input) {
  if (!Array.isArray(input) || !input.length || input.length > 500) throw Object.assign(new Error('Provide between 1 and 500 transactions.'), { statusCode: 400 });
  const rows = input.map(row => {
    const clean = Object.fromEntries(fields.map(field => [field, row?.[field]]));
    const date = new Date(`${clean.TRANSACTION_DATE}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.TRANSACTION_DATE) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== clean.TRANSACTION_DATE || typeof clean.AMOUNT !== 'number' || !Number.isFinite(clean.AMOUNT) || clean.AMOUNT < 0 || !['Credit', 'Debit'].includes(clean.TRANSACTION_TYPE) || ['DESCRIPTION', 'CATEGORY', 'ACCOUNT_NAME', 'ACCOUNT_TYPE'].some(field => typeof clean[field] !== 'string' || !clean[field].trim() || clean[field].length > 255)) throw Object.assign(new Error('Invalid transaction fields. Review the preview and try again.'), { statusCode: 400 });
    return clean;
  });
  const existing = new Map();
  for (const row of await allRows(table)) { const id = key(row); existing.set(id, (existing.get(id) || 0) + 1); }
  const occurrences = new Map(); let inserted = 0, skipped = 0;
  for (const row of rows) {
    const id = key(row), count = (occurrences.get(id) || 0) + 1;
    occurrences.set(id, count);
    if (count <= (existing.get(id) || 0)) { skipped++; continue; }
    await table.insertRow(row); inserted++;
  }
  return { inserted, skipped };
}
module.exports = { allRows, importTransactions };
