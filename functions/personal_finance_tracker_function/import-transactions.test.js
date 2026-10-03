const { test } = require('node:test');
const assert = require('node:assert/strict');
const { importTransactions } = require('./import-transactions');
const row = { TRANSACTION_DATE: '2026-09-01', DESCRIPTION: 'STORE', AMOUNT: 10, CATEGORY: 'Other', ACCOUNT_NAME: 'Chase', ACCOUNT_TYPE: 'Credit card', TRANSACTION_TYPE: 'Debit' };
test('preserve identical legitimate rows, skip reimports across pages and retry partial writes', async () => {
 const stored = []; let fail = true;
 const table = { getPagedRows: async ({nextToken}) => nextToken ? {data: stored.slice(1)} : {data: stored.slice(0,1), next_token: stored.length > 1 ? 'next' : undefined}, insertRow: async row => { if (stored.length === 1 && fail) {fail=false; throw new Error('interrupted');} stored.push(row); } };
 await assert.rejects(importTransactions(table, [row,row]));
 assert.deepEqual(await importTransactions(table,[row,row]), {inserted:1,skipped:1});
 assert.deepEqual(await importTransactions(table,[row,row]), {inserted:0,skipped:2});
 assert.equal(stored.length,2);
});
test('validate all rows before any writes', async () => {
 let writes=0; const table={insertRow:async()=>writes++};
 await assert.rejects(importTransactions(table,[row,{...row,AMOUNT:-1}]));
 assert.equal(writes,0);
});
