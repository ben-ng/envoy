var assert = require('assert')
  , _ = require('underscore')
  , path = require('path')
  , tests = {}
  , envoy = require('../../lib/envoy')
  , secrets = require('../secrets')
  , fixtures = require('../fixtures')
  , adapters = {
      memory: {}
    , ftp: secrets.ftp
    }
  /*
  * Sets up for a test
  */
  , teardown = function (cb) {
      this.after(function(err, data) {
        assert.equal(err, null, err);
        cb(null);
      });
    }
  , setup = function (adapterName, opts, cb) {
      var client
        , timeout
        , timeoutDuration = 10000;
      
      assert.doesNotThrow(function () {
        client = new require( path.join('../../lib/adapters',adapterName) );
      });
      
      timeout = setTimeout(function () {
        //Do nothing on teardown
        client.teardown = function () {};
        
        assert.ok(false,'Timeout exceeded');
      }, timeoutDuration);
      
      client.before(opts, function (err, data) {
        assert.equal(err, null, err);
        
        //Add the teardown function
        client.teardown = function(next) {
          clearTimeout(timeout);
          
          teardown.apply(client, [next]);
        };
        
        cb(client);
      });
    }
  , testCRUD = function (file, cb) {
      return function(client) {
        //console.log(" > Create");
        
        client.put(file.key, new Buffer(file.data), function(err) {
          
          assert.equal(err, null, err);
        
          //console.log(" > Read");
        
          client.get(file.key, function(err, getData) {
          
            assert.equal(err, null, err);
            assert.equal(getData, file.data);
            
            //console.log(" > Update");
        
            client.put(file.key, new Buffer(file.data + " modified"), function(err) {
              
              //console.log(" > Read");
              
              client.get(file.key, function(err, getData) {
                assert.equal(err, null, err);
                assert.equal(getData.toString(), file.data + " modified");
                
                //console.log(" > Delete");
                
                client.destroy(file.key, function(err, data) {
                  assert.equal(err, null, err);
                  
                  client.teardown(cb);
                });
              });
            });
          });
        });
      };
    };

//Shared tests for each adapter
_.each(adapters, function(opts, adapterName) {
  tests[adapterName + " CRUD alphanumeric path"] = function (next) {
    setup(adapterName, opts, testCRUD(fixtures.fileOne, next));
  };
  
  tests[adapterName + " CRUD dashes in path"] = function (next) {
    setup(adapterName, opts, testCRUD(fixtures.fileTwo, next));
  };
  
  tests[adapterName + " CRUD slashes in path"] = function (next) {
    setup(adapterName, opts, testCRUD(fixtures.fileThree, next));
  };
  
  tests[adapterName + " CRUD dotfile"] = function (next) {
    setup(adapterName, opts, testCRUD(fixtures.fileFour, next));
  };
  
  tests[adapterName + " CRUD dot in directory"] = function (next) {
    setup(adapterName, opts, testCRUD(fixtures.fileFive, next));
  };
  
  tests[adapterName + " CRUD dotfile in directory"] = function (next) {
    setup(adapterName, opts, testCRUD(fixtures.fileSix, next));
  };
});

module.exports = tests;