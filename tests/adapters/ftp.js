var assert = require('assert')
  , _ = require('underscore')
  , path = require('path')
  , tests = {}
  , envoy = require('../../lib/envoy')
  , secrets = require(path.join('../',process.env.SECRETS_FILE))
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
      var client;
      
      assert.doesNotThrow(function () {
        client = new require( path.join('../../lib/adapters',adapterName) );
      });
      
      client.before(opts, function (err, data) {
        assert.equal(err, null, err);
        
        //Add the teardown function
        client.teardown = teardown;
        
        cb(client);
      });
    };

tests["ensurePath somewhere/over/the/rainbow/file.txt"] = function (after) {
  var fixture = 'somewhere/over/the/rainbow/file.txt';
  
  setup("ftp", secrets.ftp, function (client) {
    var cleanupHandler = function (curdir, next) {
        //Check for root dir
        if(curdir == '.' || curdir == './') {
          //Nothing to do here
          next();
        }
        else {
          //Remove the directory recursively
          client.rmdir(curdir, next);
        }
      };
    
    //Ensure once
    client.ensurePath(fixture, function(err) {
      assert.equal(err, null, err);
      
      //Ensuring again should do no harm
      client.ensurePath(fixture, function(err) {
        assert.equal(err, null, err);
        
        //Cleanup
        client.handlePathBackwards(fixture, cleanupHandler, function (err) {
          assert.equal(err, null, err);
          client.teardown(after);
        });
      });
    });
  });
};

tests["use handlePath create directory recursively"] = function (after) {
  var fixture = 'somewhere/over/the/rainbow/file.txt';
  
  setup("ftp", secrets.ftp, function (client) {
    var makeHandler = function (curdir, next) {
        //Check for root dir
        if(curdir == '.' || curdir == './') {
          //Nothing to do here
          next();
        }
        else {
          //Create the directory recursively
          client.mkdir(curdir, next);
        }
      }
    , checkHandler = function (curdir, next) {
        client.list(curdir, next);
      };
    
    client.handlePath(fixture, makeHandler, function (err) {
      assert.equal(err, null, err);
      
      //Now make sure they exist
      client.handlePath(fixture, checkHandler, function (err) {
        assert.equal(err, null, err);
        
        //Cleanup
        client.trimPath(fixture, function (err) {
          assert.equal(err, null, err);
          client.teardown(after);
        });
      });
    });
  });
};

module.exports = tests;