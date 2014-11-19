var mqtt = require('mqtt')
  , logger = require('./logger')
  , config = require('iol_conf')
  , utils = require('data-utils')
  , _ = require('underscore');


var server = mqtt.createServer(function(client) {
  var self = this;
  self.clients = self.clients || {};

  client.on('connect', function(packet) {
    var punter = config.punters[packet.username];
    var found = punter && punter.sites[packet.clientId];
    if (!found || punter.getPassword() !== packet.password) {
      client.connack({returnCode: 5});
    } else {
      client.connack({returnCode: 0});

      // namespace hack to get unique client id:
      // based on the packet's username being the *punter* name
      // and the packet's clientId being the *site* name
      client.id = packet.username + "_" + packet.clientId;
      client.username = packet.username;
      client.password = packet.password;
      self.clients[client.id] = client;
    }
  });

  client.on('publish', function(packet) {
    logger.info("Incoming data: %s", packet.payload);

    if (!utils.verifyData(packet.topic, packet.payload)) {
      return logger.error("OH NO! Data verification failed!: %s -- %s",
                          packet.topic, packet.payload);
    }

    logger.info("Data (%s) verified :-)", packet.topic);

    var auth = {
      id: client.id,
      username: client.username,
      password: client.password
    };

    // tell the client that all good only once all nicely distributed
    function onSuccess(msg) {
      logger.info(msg);
      client.publish({topic: "verifiedData", payload: packet.topic});
    }

    self.distribute(auth, packet.payload, logger.error, onSuccess);
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
})

server.distribute = require('distribution');

if (!module.parent) {
  // if called directly
  logger.info("starting server on port 1883");
  server.listen(1883);
} else {
  // if called as a node module via require(..)
  module.exports = server;
}
