var mqtt = require('mqtt')
  , logger = require('./logger')
  , _ = require('underscore');


// TODO: move config to own node module
var config = {};  
config.knownClients = {
  // client_toilet: password
  'clientX_toiletX': 'clientX' // test dummy
};


mqtt.createServer(function(client) {
  self = this;
  self.clients = self.clients || {};
  self.distribute = require('distribution');

  client.on('connect', function(packet) {
    var clientId = packet.username + "_" + packet.clientId;
    var found = config.knownClients[clientId];
    if (!found || found !== packet.password) {
      client.connack({returnCode: 5});
    } else {
      client.connack({returnCode: 0});
      client.id = clientId; 
      client.username = packet.username;
      client.password = packet.password;
      self.clients[client.id] = client;
    }
  });

  client.on('publish', function(packet) {
    logger.debug("publish: payload = %s", packet.payload);
    var auth = {
      id: client.id,
      username: client.username,
      password: client.password
    };
    self.distribute(auth, packet.payload);
  });

  client.on('subscribe', function(packet) {
    logger.debug("subscribe: packet = %s", packet);
    var granted = [];
    for (var i = 0; i < packet.subscriptions.length; i++) {
      granted.push(packet.subscriptions[i].qos);
    }

    client.suback({granted: granted, messageId: packet.messageId});
  });

  client.on('pingreq', function(packet) {
    client.pingresp();
  });

  client.on('disconnect', function(packet) {
    client.stream.end();
  });

  client.on('close', function(err) {
    delete self.clients[client.id];
  });

  client.on('error', function(err) {
    console.log('error!', err);

    if (!self.clients[client.id]) return;

    delete self.clients[client.id];
    client.stream.end();
  });
}).listen(1883);
