var should = require('should'),
    _ = require('underscore'),
    mqtt = require('mqtt'),
    utils = require('data-utils'),
    logger = require('../lib/logger'),
    server = require('../lib/server');


describe('incoming_mqtt', function() {

  it('should accept an mqtt publish by a known client and call a given distribute function with expected arguments', function(done) {

    var msg =  'SensorX (1234, 567) (123 456)';
    var punter = 'punterX';
    var site = 'siteX';

    // overwrite the default distribute function as a mock
    server.distribute = function(auth, dataString, error, success) {
      auth.should.eql(
        { id: punter + '_' + site,
          username: punter,
          password: punter
        }
      );
      dataString.should.equal(msg);
      error.should.eql(logger.error);
      success("Server called success!"); // we check success listening for a message further below
      server.close();
    };
    server.listen(1884);

    client = mqtt.createClient(1884, 'localhost', {
      clientId: site,
      username: punter,
      password: punter
    });
    var checksum = utils.checkchecksum(msg);
    client.on('message', function(toppic, message) {
      toppic.should.equal('verifiedData');
      message.should.equal(checksum);
      client.end();
      done();
    });
    client.publish(checksum, msg);
  });

});
