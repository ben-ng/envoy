var assert = require('assert')
  , _ = require('underscore')
  , path = require('path')
  , tests = {}
  , envoy = require('../../lib/envoy')
  , testNormalizePath = function(fixture, expected) {
      var client;
      
      assert.doesNotThrow(function () {
        client = new require( path.join('../../lib/adapters/base') );
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
        client = new require( path.join('../../lib/adapters/base') );
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

module.exports = tests;