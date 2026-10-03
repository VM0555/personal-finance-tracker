// Chase text statements only. Never infer transactions from summary balances.
export function linesFromItems(items) {
  const lines = []
  for (const item of items.filter(item => item.str?.trim()).sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])) {
    let line = lines.find(line => Math.abs(line.y - item.transform[5]) < 2)
    if (!line) { line = { y: item.transform[5], items: [] }; lines.push(line) }
    line.items.push(item)
  }
  return lines.map(line => line.items.sort((a, b) => a.transform[4] - b.transform[4]).map(item => item.str).join(' ')).join('\n')
}

export function categorize(description, credit = false) {
  if (/payment thank you/i.test(description)) return 'Transfer'
  if (credit) return 'Refund'
  const rules = [
    [/gas|speedway|exxon|flying j/i, 'Gas & fuel'],
    [/chipotle|chick-fil|arbys|biryani|chai bisket|cheesecake|creamery|ikea.*rest/i, 'Dining'],
    [/costco|publix|suvidha|patel brothers|cherians|maruthi foods/i, 'Groceries'],
    [/sawnee|electric/i, 'Utilities'],
    [/cvs|walgreens|pharmacy/i, 'Health'],
    [/barber/i, 'Personal care'],
    [/toll|AT035/i, 'Transport'],
    [/ikea|macys|express#|flowers|wines|spirits/i, 'Shopping'],
  ]
  return rules.find(([pattern]) => pattern.test(description))?.[1] || 'Other'
}

export function parseChaseStatement(text) {
  if (!/chase/i.test(text) || !/ACCOUNT ACTIVITY/i.test(text)) throw new Error('Only readable Chase credit-card statements are supported currently. Scanned PDFs need OCR.')
  const period = text.match(/Opening\/Closing Date\s+(\d{2})\/(\d{2})\/(\d{2})\s*-\s*(\d{2})\/(\d{2})\/(\d{2})/i)
  if (!period) throw new Error('Statement dates could not be detected.')
  const closeMonth = Number(period[4]), closeYear = 2000 + Number(period[6])
  const last4 = text.match(/Account (?:Number|number):\s*(?:X+\s*)+(\d{4})/i)?.[1]
  const rows = []; let active = false
  for (const line of text.split('\n')) {
    if (/ACCOUNT ACTIVITY/i.test(line)) { active = true; continue }
    if (/Totals Year-to-Date|INTEREST CHARGES/i.test(line)) active = false
    if (!active) continue
    const match = line.trim().match(/^(\d{2})\/(\d{2})\s+(.+?)\s+(-?\d[\d,]*\.\d{2})$/)
    if (!match) continue
    const month = Number(match[1]), day = Number(match[2]), year = closeYear - (month > closeMonth ? 1 : 0)
    const date = new Date(Date.UTC(year, month - 1, day))
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error('Invalid transaction date.')
    const signed = Number(match[4].replaceAll(',', ''))
    const description = match[3].trim()
    rows.push({ TRANSACTION_DATE: `${year}-${match[1]}-${match[2]}`, DESCRIPTION: description, AMOUNT: Math.abs(signed), CATEGORY: categorize(description, signed < 0), ACCOUNT_NAME: `Chase credit card${last4 ? ` • ${last4}` : ''}`, ACCOUNT_TYPE: 'Credit card', TRANSACTION_TYPE: signed < 0 ? 'Credit' : 'Debit' })
  }
  if (!rows.length) throw new Error('No readable transactions found in the activity table.')
  const expected = text.match(/Purchases\s*\+?\$([\d,]+\.\d{2})/i)
  const purchaseCents = rows.filter(row => row.TRANSACTION_TYPE === 'Debit').reduce((sum, row) => sum + Math.round(row.AMOUNT * 100), 0)
  if (!expected || purchaseCents !== Math.round(Number(expected[1].replaceAll(',', '')) * 100)) throw new Error('Extracted purchases do not match the statement summary. Import stopped to avoid incomplete data.')
  return { rows, purchaseTotal: purchaseCents / 100 }
}

export function transactionKey(row) {
  return JSON.stringify([String(row.TRANSACTION_DATE).slice(0, 10), row.DESCRIPTION.trim(), Math.round(Number(row.AMOUNT) * 100), row.ACCOUNT_NAME, row.TRANSACTION_TYPE])
}
