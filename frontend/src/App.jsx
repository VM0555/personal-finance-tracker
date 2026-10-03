import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  ChartNoAxesCombined,
  WalletCards,
  Bell,
  ChevronDown,
  Plus,
  TrendingUp,
  DollarSign,
  PiggyBank,
  Search,
  MoreHorizontal,
  ShoppingCart,
} from 'lucide-react'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import './App.css'

const cashFlow = [
  { month: 'May', income: 7900, spending: 5100 },
  { month: 'Jun', income: 8200, spending: 4650 },
  { month: 'Jul', income: 8200, spending: 5200 },
  { month: 'Aug', income: 8400, spending: 6100 },
  { month: 'Sep', income: 8200, spending: 4300 },
  { month: 'Oct', income: 8200, spending: 3842 },
]

const categoryColors = [
  '#667eea',
  '#34b3a0',
  '#f6ad55',
  '#a78bfa',
  '#f87171',
  '#38bdf8',
  '#facc15',
  '#fb7185',
]



const stocks = [
  { ticker: 'NVDA', name: 'NVIDIA', value: 5420.8, gain: 18.4 },
  { ticker: 'SMH', name: 'Semiconductor ETF', value: 4810.2, gain: 12.6 },
  { ticker: 'JPM', name: 'JPMorgan Chase', value: 3240.4, gain: 7.2 },
]

function MetricCard({ icon: Icon, label, value, note, positive }) {
  return (
    <div className="metricCard">
      <div className="metricTop">
        <div className="metricIcon">
          <Icon size={19} />
        </div>
        <MoreHorizontal size={18} className="mutedIcon" />
      </div>

      <p>{label}</p>
      <h2>{value}</h2>

      <div className={positive ? 'metricNote positive' : 'metricNote'}>
        {positive && <TrendingUp size={14} />}
        {note}
      </div>
    </div>
  )
}

function App() {
  const [period, setPeriod] = useState('This month')
  const [account, setAccount] = useState('All accounts')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const categoryTotals = transactions
    .filter((transaction) => transaction.TRANSACTION_TYPE === 'Debit')
    .reduce((totals, transaction) => {
      const category = transaction.CATEGORY || 'Other'
      const amount = Number(transaction.AMOUNT || 0)

      totals[category] = (totals[category] || 0) + amount

      return totals
    }, {})

  const categories = Object.entries(categoryTotals).map(
    ([name, value], index) => ({
      name,
      value,
      color: categoryColors[index % categoryColors.length],
    })
  )

  const totalIncome = transactions
  .filter((transaction) => transaction.TRANSACTION_TYPE === 'Credit')
  .reduce((total, transaction) => total + Number(transaction.AMOUNT || 0), 0)

const totalSpending = transactions
  .filter((transaction) => transaction.TRANSACTION_TYPE === 'Debit')
  .reduce((total, transaction) => total + Number(transaction.AMOUNT || 0), 0)

const totalSavings = totalIncome - totalSpending

const formatCurrency = (amount) =>
  amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  useEffect(() => {
    const controller = new AbortController()
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '/server/personal_finance_tracker_function').replace(/\/$/, '')

    async function loadTransactions() {
      try {
        const response = await fetch(`${apiBase}/transactions`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Unable to load transactions (HTTP ${response.status}).`)
        }
        const result = await response.json()
        if (result.status === 'error') {
          throw new Error(result.message || 'Unable to load transactions.')
        }
        const rows = Array.isArray(result) ? result : result.data ?? result.rows
        if (!Array.isArray(rows)) {
          throw new Error('The transactions API returned an unexpected response.')
        }
        setTransactions(rows)
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error.message || 'Unable to load transactions.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadTransactions()
    return () => controller.abort()
  }, [])

  return (
    <div className="appShell">

      <aside className="sidebar">
        <div className="logo">
          <div className="logoMark">
            <WalletCards size={23} />
          </div>

          <div>
            <strong>MyFinance</strong>
            <span>Personal Tracker</span>
          </div>
        </div>

        <div className="navLabel">OVERVIEW</div>

        <nav>
          <button className="navLink active">
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button className="navLink">
            <ArrowLeftRight size={19} />
            Transactions
          </button>

          <button className="navLink">
            <Upload size={19} />
            Statements
          </button>

          <button className="navLink">
            <ChartNoAxesCombined size={19} />
            Investments
          </button>
        </nav>

        <div className="sidebarBottom">
          <div className="profileAvatar">VM</div>
          <div>
            <strong>Personal Account</strong>
            <span>Finance workspace</span>
          </div>
        </div>
      </aside>

      <main className="dashboard">

        <header className="topbar">
          <div>
            <h1>Financial overview</h1>
            <p>Track spending, cash flow and investments in one place.</p>
          </div>

          <div className="topActions">
            <button className="iconButton">
              <Bell size={19} />
            </button>

            <button className="primaryButton">
              <Upload size={17} />
              Upload statement
            </button>
          </div>
        </header>

        {loading && <p role="status">Loading transactions…</p>}
        {loadError && <p role="alert">{loadError} Check that the Catalyst API is running.</p>}

        <div className="filters">
          <div className="selectWrap">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>This month</option>
              <option>Last month</option>
              <option>Last 3 months</option>
              <option>This year</option>
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="selectWrap">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              <option>All accounts</option>
              <option>Checking</option>
              <option>Credit cards</option>
              <option>Investments</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>

        <section className="metricGrid">
          <MetricCard
            icon={DollarSign}
            label="Total income"
            value={formatCurrency(totalIncome)}
            note="October income"
          />

          <MetricCard
            icon={WalletCards}
            label="Total spending"
            value={formatCurrency(totalSpending)}
            note="8.4% lower than last month"
            positive
          />

          <MetricCard
            icon={PiggyBank}
            label="Total savings"
            value={formatCurrency(totalSavings)}
            note="53.1% savings rate"
            positive
          />

          <MetricCard
            icon={TrendingUp}
            label="Investments"
            value="$18,450.20"
            note="+$1,240.30 total return"
            positive
          />
        </section>

        <section className="chartGrid">

          <div className="panel cashFlowPanel">
            <div className="panelTitle">
              <div>
                <h3>Cash flow</h3>
                <p>Income compared with spending</p>
              </div>

              <div className="legend">
                <span><i className="incomeDot" /> Income</span>
                <span><i className="spendingDot" /> Spending</span>
              </div>
            </div>

            <div className="chartContainer">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlow}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34b3a0" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#34b3a0" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf0f5"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8a94a6', fontSize: 12 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8a94a6', fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />

                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />

                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#667eea"
                    strokeWidth={2.5}
                    fill="url(#incomeGradient)"
                  />

                  <Area
                    type="monotone"
                    dataKey="spending"
                    stroke="#34b3a0"
                    strokeWidth={2.5}
                    fill="url(#spendingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel spendingPanel">
            <div className="panelTitle">
              <div>
                <h3>Spending</h3>
                <p>By category</p>
              </div>

              <button className="textButton">View report</button>
            </div>

            <div className="donutArea">
              <div className="donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      innerRadius={65}
                      outerRadius={86}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {categories.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="donutCenter">
                  <span>Total</span>
                  <strong>{formatCurrency(totalSpending)}</strong>
                </div>
              </div>

              <div className="categoryLegend">
                {categories.map((item) => (
                  <div className="categoryRow" key={item.name}>
                    <div>
                      <i style={{ background: item.color }} />
                      <span>{item.name}</span>
                    </div>

                    <strong>${item.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

        <section className="bottomGrid">

          <div className="panel">
            <div className="panelTitle">
              <div>
                <h3>Recent transactions</h3>
                <p>Your latest account activity</p>
              </div>

              <div className="transactionActions">
                <button className="searchButton">
                  <Search size={17} />
                </button>
                <button className="textButton">View all</button>
              </div>
            </div>

            <div className="transactionList">
              {!loading && !loadError && transactions.length === 0 && (
                <p>No transactions yet.</p>
              )}
              {transactions.map((transaction, index) => {
                const Icon = ShoppingCart

                return (
                  <div className="transactionRow" key={transaction.ROWID ?? index}>
                    <div className="transactionInfo">
                      <div className="transactionIcon">
                        <Icon size={17} />
                      </div>

                      <div>
                        <strong>{transaction.DESCRIPTION}</strong>
                        <span>{transaction.TRANSACTION_DATE}</span>
                      </div>
                    </div>

                    <span className="transactionCategory">
                      {transaction.CATEGORY}
                    </span>

                    <strong
                      className={
                        transaction.TRANSACTION_TYPE === 'Credit'
                          ? 'transactionAmount positive'
                          : 'transactionAmount'
                      }
                    >
                      {transaction.TRANSACTION_TYPE === 'Credit' ? '+' : '-'}$
                      {Math.abs(Number(transaction.AMOUNT)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel portfolioPanel">
            <div className="panelTitle">
              <div>
                <h3>Portfolio</h3>
                <p>Investment performance</p>
              </div>

              <button className="addButton">
                <Plus size={16} />
                Add
              </button>
            </div>

            <div className="portfolioTotal">
              <span>Portfolio value</span>
              <h2>$18,450.20</h2>
              <div className="portfolioGain">
                <TrendingUp size={15} />
                $1,240.30 (7.21%)
              </div>
            </div>

            <div className="stockList">
              {stocks.map((stock) => (
                <div className="stockRow" key={stock.ticker}>
                  <div className="stockIdentity">
                    <div className="ticker">{stock.ticker.slice(0, 2)}</div>
                    <div>
                      <strong>{stock.ticker}</strong>
                      <span>{stock.name}</span>
                    </div>
                  </div>

                  <div className="stockValue">
                    <strong>
                      ${stock.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                    <span>+{stock.gain}%</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="portfolioButton">
              View portfolio
            </button>
          </div>

        </section>

      </main>
    </div>
  )
}

export default App