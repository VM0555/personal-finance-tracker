# personal-finance-tracker
A personal finance app to analyze bank statements, track spending. manage stock investments, and email weekly portfolio updates


## Run locally

Use Node.js 22.12+ or 24. From the repository root, run `catalyst serve` after signing in to Zoho Catalyst and selecting the configured project. The Transactions datastore table must exist.

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite. Requests under `/server` are proxied to Catalyst on port 3000, including when Vite chooses another frontend port. For a separately hosted API, set `VITE_API_BASE_URL` to its function base URL before starting or building the frontend; that API must allow your frontend origin.

The investments and cash-flow chart currently show sample data; the transaction totals and spending categories use the Transactions API. Portfolio actions are not implemented yet.

## PDF statement import

Choose **Upload statement** (or **Statements**) and select a readable Chase credit-card PDF. The browser extracts its activity table and requires the purchase sum to match the summary before showing a preview. Edit categories, then choose **Import reviewed transactions**. The original PDF stays in your browser; only approved transaction fields are sent to Catalyst. Scanned PDFs, password-protected PDFs, and other bank layouts are not currently supported.

Card payments are categorized as Transfer and refunds as Refund; neither counts as income. Purchases on Costco statements are suggested as Groceries and may need category edits.

The API reads all datastore pages and skips transactions already present for the same account, date, description, amount, and credit/debit type. Counts preserve multiple identical rows in the same statement and allow retry after a partial save. Import one statement at a time: concurrent imports are not transactionally locked, and genuinely distinct identical transactions across different statements require manual review. Use a consistent account name for manual records to match imports. No new datastore columns are required.

Verify with `node --test frontend/test/statement.test.js functions/personal_finance_tracker_function/import-transactions.test.js`, plus `npm run build` and `npm run lint` in frontend.
