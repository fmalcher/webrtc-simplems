var WebSocketServer = require('websocket').server;
var http = require('http');
var clients = [];
var client_names = [];
var conversations = [];
var port;

// if first argument (Port) is set
if(process.argv[2]){
  port = process.argv[2]
} else port = 1337; // else use standard port


var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets server
  // we don't have to implement anything.
});
server.listen(port, function() {
  console.log((new Date()) + " Messaging Server is listening on port ", port);
});

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

function sendCallback(err) {
  if (err)
    console.error("send() error: " + err);
}

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
  var connection = request.accept(null, request.origin);
  console.log(' Connection ' + connection.remoteAddress);

  clients.push(connection);

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    //console.log("Message type: " + message.type);
    if (message.type === 'utf8') {
      // process WebSocket message
      //console.log((new Date()) + ' Received Message ' + message.utf8Data);
      var JSON_message = JSON.parse(message.utf8Data);



      switch (JSON_message.type) {
        case "login":
          /*
           * LOGIN
           *
           * JSON_message.type == "login"
           * JSON_message.from == JSON_message.to == JSON_message.body == username (takes it from .from)
           */
          var login = clients.indexOf(connection);
          client_names[login] = JSON_message.from;
          /*console.log("clients: ", clients);
           console.log("client_names: ", client_names);*/
          // console.log((new Date()) + " New name for " + connection.remoteAddress + " is " + client_names[login]);
          break;
        case "message":
          /*
           * MESSAGE
           *
           * The server fills automatically the "from" field.
           *
           * JSON_message.type == "message"
           * JSON_message.to == destination
           * JSON_message.body == message_to_send
           * JSON_message.from == sender
           */
          //console.log("JSON_message: ", JSON_message);
          if (JSON_message.body.type == "invitation") {
            console.log("JSON_message INVITATION: ", JSON_message);
            var exist = false; //why?
            for (var i = 0; i < conversations.length; i++) {
              if (conversations[i].contextId === JSON_message.contextId) {
                exist = true;
                break;
              }
            }
            if (!exist) {
              console.log("JSON_message.body.peers: ", JSON_message.body.peers ? JSON_message.body.peers.toString():"");
              conversations.push({
                "contextId": JSON_message.contextId,
                "users": JSON_message.body.peers
              })
            }
            var to_index = client_names.indexOf(JSON_message.to);
            if (to_index != "-1") {
              JSON_message.from = client_names[clients.indexOf(connection)];
              clients[to_index].send(JSON.stringify(JSON_message));
              //console.log((new Date()) + " Message: " + JSON.stringify(JSON_message.body) + " sent to: " + JSON_message.to + " from: " + client_names[clients.indexOf(connection)]);
            } else {
              console.log((new Date()) + " User: " + JSON_message.to + " not found.");
            }
          } else if (JSON_message.body.type === 'accepted' && (JSON_message.body.to == null || JSON_message.body.to == "")) {
            console.log("JSON_message accepted: ", JSON_message);
            conversations.forEach(function(element, array, index) {
              console.log("ELEMENT: ", element.contextId);
              console.log("ELEMENT: ", element.users);
              if (element.contextId == JSON_message.contextId) {
                element.users.forEach(function(element, array, index) {
                  var to_index = client_names.indexOf(element);
                  if (to_index != "-1") {
                    JSON_message.from = client_names[clients.indexOf(connection)];
                    clients[to_index].send(JSON.stringify(JSON_message));
                    //console.log((new Date()) + " Message: " + JSON.stringify(JSON_message.body) + " sent to: " + JSON_message.to + " from: " + client_names[clients.indexOf(connection)]);
                  } else {
                    console.log((new Date()) + " User: " + JSON_message.to + " not found.");
                  }
                });
              }
            });

            //console.log("ACCEPTED TO SEND ALL THAT PEOPLE: ");

          } else {

            var to_index = client_names.indexOf(JSON_message.to);
            if (to_index != "-1") {
              JSON_message.from = client_names[clients.indexOf(connection)];
              clients[to_index].send(JSON.stringify(JSON_message));
              //console.log((new Date()) + " Message: " + JSON.stringify(JSON_message.body) + " sent to: " + JSON_message.to + " from: " + client_names[clients.indexOf(connection)]);
            } else {
              console.log((new Date()) + " User: " + JSON_message.to + " not found.");
            }

          }






          break;

        case "endofcandidates":
          /*
           * END OF CANDIDATES
           *
           * The server fills automatically the "from" field.
           *
           * JSON_message.type == "endofcandidates"
           * JSON_message.to == ""
           * JSON_message.body == ""
           * JSON_message.from == ""
           */
          console.log((new Date()) + " End of candidates for user " + client_names[clients.indexOf(connection)]);
          // For SIP, when you have all the candidates already you can send the SDP.
          break;

          // broadcast message to all connected clients
          //clients.forEach(function (outputConnection) {
          //    if (outputConnection != connection) {
          //      outputConnection.send(message.utf8Data, sendCallback);
          //   }
          //  }
      }
    }

    console.log('client names: ',client_names);
  });

  /*
   * Connection closing, deleting connection and name.
   */
  connection.on('close', function() {
    var connection_index = clients.indexOf(connection);
    console.log((new Date()) + " Peer '" + connection_index + "' with name '" + client_names[connection_index] + "' and address '" + connection.remoteAddress + "' disconnected");
    clients.splice(connection_index, 1);
    client_names.splice(connection_index, 1);
  });
});
