const express = require('express')
const app = express()
const port = 3030
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
})

const contracts = []

app.get('/contracts', (req, res) => {
  res.json(contracts)
})

app.post('/contracts', (req, res) => {
    contracts.push(req.body)
    res.send("successful")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})