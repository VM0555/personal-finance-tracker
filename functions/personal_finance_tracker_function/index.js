'use strict';
const { allRows, importTransactions } = require('./import-transactions');

const { IncomingMessage, ServerResponse } = require("http");
const { zcAuth } = require("@zcatalyst/auth");
const { Datastore } = require("@zcatalyst/datastore");

/**
 * CORS headers for local React development
 */
const corsHeaders = {
	'Access-Control-Allow-Origin': 'http://localhost:5173',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

/**
 * Read JSON sent in a POST request
 */
function readRequestBody(req) {
	return new Promise((resolve, reject) => {
		let body = '';
        let tooLarge = false;

		req.on('data', chunk => {
            if (tooLarge) return;
            body += chunk.toString();
            if (Buffer.byteLength(body) > 1024 * 1024) {
                tooLarge = true;
                reject(Object.assign(new Error('Request too large.'), { statusCode: 413 }));
            }
		});

		req.on('end', () => {
			try {
				resolve(body ? JSON.parse(body) : {});
			} catch (error) {
                reject(Object.assign(error, { statusCode: 400 }));
			}
		});

		req.on('error', reject);
	});
}

/**
 *
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 */
module.exports = async (req, res) => {

	const url = new URL(req.url, 'http://localhost').pathname.replace(/^\/server\/personal_finance_tracker_function/, '') || '/';
	const method = req.method;

	// Handle browser CORS preflight request
	if (method === 'OPTIONS') {
		res.writeHead(204, corsHeaders);
		res.end();
		return;
	}

	try {

		await zcAuth.init(req);

		const datastore = new Datastore();
		const transactionsTable = datastore.table('Transactions');

		// GET all transactions
		if (url === '/transactions' && method === 'GET') {

			const transactions =
				{ data: await allRows(transactionsTable) };

			res.writeHead(200, {
				...corsHeaders,
				'Content-Type': 'application/json'
			});

			res.end(JSON.stringify(transactions));
			return;
		}

		if (url === '/transactions/import' && method === 'POST') {
            const body = await readRequestBody(req);
            const result = await importTransactions(transactionsTable, body.rows);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
            return;
        }

		// POST a new transaction
		if (url === '/transactions' && method === 'POST') {

			const body = await readRequestBody(req);

			const newTransaction = {
				TRANSACTION_DATE: body.TRANSACTION_DATE,
				DESCRIPTION: body.DESCRIPTION,
				AMOUNT: body.AMOUNT,
				CATEGORY: body.CATEGORY,
				ACCOUNT_NAME: body.ACCOUNT_NAME,
				ACCOUNT_TYPE: body.ACCOUNT_TYPE,
				TRANSACTION_TYPE: body.TRANSACTION_TYPE
			};

			const insertedTransaction =
				await transactionsTable.insertRow(newTransaction);

			res.writeHead(201, {
				...corsHeaders,
				'Content-Type': 'application/json'
			});

			res.end(JSON.stringify({
				status: 'success',
				data: insertedTransaction
			}));

			return;
		}

		// Home route
		if (url === '/' && method === 'GET') {

			res.writeHead(200, {
				...corsHeaders,
				'Content-Type': 'application/json'
			});

			res.end(JSON.stringify({
				message: 'MyFinance Catalyst API is running',
				status: 'success'
			}));

			return;
		}

		res.writeHead(404, {
			...corsHeaders,
			'Content-Type': 'application/json'
		});

		res.end(JSON.stringify({
			status: 'error',
			message: 'Route not found'
		}));

	} catch (error) {

		console.error(error);

		res.writeHead(error.statusCode || 500, {
			...corsHeaders,
			'Content-Type': 'application/json'
		});

		res.end(JSON.stringify({
			status: 'error',
			message: error.message
		}));
	}
};