var should = require('should')
  , _ = require('underscore')
  , mqtt = require('mqtt')
  , logger = require('../lib/logger')
  , server = require('../lib/server');


describe('incoming_mqtt', function() {

  it('should accept an mqtt publish by a known client and call a given distribute function with expected arguments', function(done) {

    msg =  'sensorX (1234, 567) (123 456)';

    // overwrite the default distribute function as a mock
    server.distribute = function(auth, dataString, callback) {
      auth.should.eql(
        { id: 'clientX_toiletX',
          username: 'clientX',
          password: 'clientX'
        }
      );
      dataString.should.equal(msg);
      callback.should.eql(logger.error);
      server.close();
      done();
    };
    server.listen(1884)

    client = mqtt.createClient(1884, 'localhost', {
      clientId: "toiletX",
      username: "clientX",
      password: "clientX"
    });
    client.publish('unimportant_tag', msg);
    client.end();
  });


});
