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

The investments and cash-flow chart currently show sample data; the transaction totals and spending categories use the Transactions API. Statement upload and portfolio actions are not implemented yet.
