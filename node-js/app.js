'use strict';
var IntrinioRealtime = require('intrinio-realtime')

// Create an IntrinioRealtime instance
var ir = new IntrinioRealtime({
  username: "INTRINIO_API_USERNAME",
  password: "INTRINIO_API_PASSWORD",
})

// Listen for quotes
ir.onQuote(quote => {
  var { ticker, type, price, size, timestamp } = quote
  console.log("QUOTE: ", ticker, type, price, size, timestamp)
})

// Join channels
ir.join("AAPL", "MSFT", "GE")
