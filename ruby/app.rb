require "uri"
require "http"
require "eventmachine"
require "websocket-client-simple"

# Request auth token
api_username = "API_USERNAME"
api_password = "API_PASSWORD"
auth_url = "https://realtime.intrinio.com/auth"

token = HTTP.basic_auth(:user => api_username, :pass => api_password)
            .get(auth_url)
            .body

EM.run do
  # Connect to Intrinio's WebSocket
  socket_url = URI.escape("wss://realtime.intrinio.com/socket/websocket?vsn=1.0.0&token=#{token}")
  ws = WebSocket::Client::Simple.connect(socket_url)

  # Connect to a channel to listen for prices
  ws.on :open do
    # Setup a heartbeat
    EM.add_periodic_timer(30) do
      ws.send({
        topic: 'phoenix',
        event: 'heartbeat',
        payload: {},
        ref: nil
      }.to_json)
    end

    # Listen to a security
    ws.send({
      topic: "iex:securities:AAPL",
      event: "phx_join",
      payload: {},
      ref: "1"
    }.to_json)
  end

  # Parse prices from incoming messages
  ws.on :message do |msg|
    message = JSON.parse(msg.data)
    if message["event"] == "quote"
      quote = message["payload"]
      puts "== QUOTE ==== "
      puts "TYPE: #{quote["type"]}"
      puts "TICKER: #{quote["ticker"]}"
      puts "PRICE: #{quote["price"]}"
      puts "SIZE: #{quote["size"]}"
      puts "============= "
    else
      puts msg
    end
  end

  ws.on :close do |e|
    puts e
    exit 1
  end

  ws.on :error do |e|
    puts e
  end


end
