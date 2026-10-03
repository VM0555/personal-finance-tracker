import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseChaseStatement } from '../src/statement.js'
const header = 'Chase\nOpening/Closing Date 12/15/25 - 01/14/26\nAccount Number: XXXX XXXX XXXX 1234\nPurchases +$20.00\nACCOUNT ACTIVITY\n'
test('Chase parser handles year rollover and excludes payment from income', () => {
  const parsed = parseChaseStatement(header + '12/31 COSTCO GAS ATLANTA GA 20.00\n01/02 Payment Thank You-Mobile -40.00\n2026 Totals Year-to-Date')
  assert.equal(parsed.rows[0].TRANSACTION_DATE, '2025-12-31')
  assert.equal(parsed.rows[0].CATEGORY, 'Gas & fuel')
  assert.equal(parsed.rows[1].CATEGORY, 'Transfer')
  assert.equal(parsed.purchaseTotal, 20)
})
test('reject incomplete extraction and unsupported layouts', () => {
  assert.throws(() => parseChaseStatement(header + '01/01 STORE 19.00'), /do not match/)
  assert.throws(() => parseChaseStatement('scanned statement'), /readable Chase/)
})
