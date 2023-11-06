const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Online Study server running')
})

app.listen(port, () => {
  console.log(`Online sever running on port ${port}`)
})