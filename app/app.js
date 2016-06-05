(function() {

  // Request auth token
  var username = "YOUR_API_USERNAME";
  var password = "YOUR_API_PASSWORD";
  var auth_url = "https://realtime.intrinio.com/auth";

  $.ajax({
    type: "GET",
    url: auth_url,
    beforeSend: function(xhr) {
      xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
    },
    success: function(token) {
      connect(token);
    },
    error: function(xhr, status, error) {
      console.error("Error connecting: ", error);
    }
  });

  // Connect to Intrinio's WebSocket
  var socket_url = "wss://realtime.intrinio.com/socket";

  var connect = function(token) {
    var socket = new Phoenix.Socket(socket_url, { params: { token: token } });
    socket.connect();
    socket.onClose(function (e) {
      return console.log("CLOSE", e);
    });

    startListening(socket);
  };

  // Connect to a channel to listen for prices
  var startListening = function(socket) {
    var channel = socket.channel("iex:securities:AAPL", {})

    channel.join()
      .receive("ok", function () {
        return console.log("joined ok");
      })
      .receive("ignore", function () {
        return console.warn("auth error");
      })
      .receive("timeout", function () {
        return console.error("connection interruption");
      });

    channel.onError(function (e) {
      return console.error("channel error", e);
    });

    channel.onClose(function (e) {
      return console.log("channel closed", e);
    });

    channel.on("quote", function (msg) {
      var ticker = msg.ticker;
      var type = msg.type;
      var timestamp = moment.unix(parseFloat(msg.timestamp)).format('h:mm:ss.SSS');
      var price = numeral(parseFloat(msg.price)).format('$0,0.00');
      var size = msg.size;

      console.log(ticker, type, timestamp, price, size);
    });
  };

})();
