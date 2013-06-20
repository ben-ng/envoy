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
    }
  , testNormalizePath = function(fixture, expected) {
      var client;
      
      assert.doesNotThrow(function () {
        client = new require( path.join('../../lib/adapters/ftp') );
      });
      
      assert.strictEqual(client.normalize(fixture), expected);
    }
  , testHandlePath = function(fixture, expected, cb) {
      var buffer = []
        , reverseBuffer = []
        , handler = function (curdir, next) {
          buffer.push(curdir);
          next();
        }
        , reverseHandler = function (curdir, next) {
          //look: unshifts instead
          reverseBuffer.unshift(curdir);
          next();
        }
        , client;
      
      assert.doesNotThrow(function () {
        client = new require( path.join('../../lib/adapters/ftp') );
      });
      
      client.handlePath(fixture, handler, function (err) {
        assert.equal(err, null, err);
        assert.deepEqual(buffer, expected);
        
        client.handlePathBackwards(fixture, reverseHandler, function (err) {
          assert.equal(err, null, err);
          assert.deepEqual(reverseBuffer, expected);
          
          cb();
        });
      });
    };

tests["normalizePath blank"] = function () {
  testNormalizePath('', './');
};

tests["normalizePath ."] = function () {
  testNormalizePath('.', './');
};

tests["normalizePath ./"] = function () {
  testNormalizePath('./', './');
};

tests["normalizePath /"] = function () {
  testNormalizePath('/', '/');
};

tests["normalizePath .dotfile"] = function () {
  testNormalizePath('.dotfile', './.dotfile');
};

tests["normalizePath /.dotfile"] = function () {
  testNormalizePath('/.dotfile', '/.dotfile');
};

tests["normalizePath ./.dotfile"] = function () {
  testNormalizePath('./.dotfile', './.dotfile');
};

tests["normalizePath ./.dotfile/"] = function () {
  testNormalizePath('./.dotfile/', './.dotfile');
};

tests["normalizePath /my.file.txt"] = function () {
  testNormalizePath('/my.file.txt', '/my.file.txt');
};

tests["normalizePath ./my.file.txt"] = function () {
  testNormalizePath('./my.file.txt', './my.file.txt');
};

tests["normalizePath my.file.txt"] = function () {
  testNormalizePath('my.file.txt', './my.file.txt');
};

tests["normalizePath ./relative/path"] = function () {
  testNormalizePath('./relative/path', './relative/path/');
};

tests["normalizePath /absolute/path"] = function () {
  testNormalizePath('/absolute/path', '/absolute/path/');
};

tests["normalizePath ambiguous/path"] = function () {
  testNormalizePath('ambiguous/path', './ambiguous/path/');
};

tests["normalizePath ambiguous/path"] = function () {
  testNormalizePath('ambiguous/path/', './ambiguous/path/');
};

tests["handlePath to relative file"] = function (after) {
  var fixture = 'somewhere/over/the/rainbow/file.txt'
    , expected = [
        './'
      , 'somewhere/'
      , 'somewhere/over/'
      , 'somewhere/over/the/'
      , 'somewhere/over/the/rainbow/'
      ];
  
  testHandlePath(fixture, expected, after);
};

tests["handlePath to relative dotfile"] = function (after) {
  var fixture = 'somewhere/over/the/rainbow/.dotfile'
    , expected = [
        './'
      , 'somewhere/'
      , 'somewhere/over/'
      , 'somewhere/over/the/'
      , 'somewhere/over/the/rainbow/'
      ];
  
  testHandlePath(fixture, expected, after);
};

tests["handlePath to absolute file"] = function (after) {
  var fixture = '/somewhere/over/the/rainbow/file.txt'
    , expected = [
        '/'
      , '/somewhere/'
      , '/somewhere/over/'
      , '/somewhere/over/the/'
      , '/somewhere/over/the/rainbow/'
      ];
  
  testHandlePath(fixture, expected, after);
};

tests["handlePath to relative directory"] = function (after) {
  var fixture = 'somewhere/over/the/rainbow/'
    , expected = [
        './'
      , 'somewhere/'
      , 'somewhere/over/'
      , 'somewhere/over/the/'
      , 'somewhere/over/the/rainbow/'
      ];
  
  testHandlePath(fixture, expected, after);
};

tests["handlePath to absolute directory"] = function (after) {
  var fixture = '/somewhere/over/the/rainbow/'
    , expected = [
        '/'
      , '/somewhere/'
      , '/somewhere/over/'
      , '/somewhere/over/the/'
      , '/somewhere/over/the/rainbow/'
      ];
  
  testHandlePath(fixture, expected, after);
};

tests["handlePath to absolute directory"] = function (after) {
  var fixture = '/somewhere/over/the/rainbow/'
    , expected = [
        '/'
      , '/somewhere/'
      , '/somewhere/over/'
      , '/somewhere/over/the/'
      , '/somewhere/over/the/rainbow/'
      ];
  
  testHandlePath(fixture, expected, after);
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

tests["handlePath create directory recursively"] = function (after) {
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