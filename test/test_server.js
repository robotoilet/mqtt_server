var should = require('should')
  , _ = require('underscore')
  , mqtt = require('mqtt')
  , logger = require('../lib/logger')
  , server = require('../lib/server');


describe('incoming_mqtt', function() {

  it('should accept an mqtt publish by a known client and call a given distribute function with expected arguments', function(done) {

    var msg =  'SensorX (1234, 567) (123 456)';
    var punter = 'punterX';
    var site = 'siteX';

    // overwrite the default distribute function as a mock
    server.distribute = function(auth, dataString, callback) {
      auth.should.eql(
        { id: punter + '_' + site,
          username: punter,
          password: punter
        }
      );
      dataString.should.equal(msg);
      callback.should.eql(logger.error);
      server.close();
      done();
    };
    server.listen(1884)

    client = mqtt.createClient(1884, 'localhost', {
      clientId: site,
      username: punter,
      password: punter
    });
    client.publish('unimportant_tag', msg);
    client.end();
  });


});
