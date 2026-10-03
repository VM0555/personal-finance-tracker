const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'MyFinance API is running',
    status: 'success',
  })
})

app.get('/api/dashboard', (req, res) => {
  res.json({
    income: 8200,
    spending: 3842.50,
    savings: 4357.50,
    investments: 18450.20,
  })
})

app.listen(PORT, () => {
  console.log(`MyFinance backend running on http://localhost:${PORT}`)
})