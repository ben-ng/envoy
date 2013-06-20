var assert = require('assert')
  , _ = require('underscore')
  , tests
  , envoy = require('../lib/envoy.js')
  , fixtures = require('./fixtures')
  , fixturesToMap = function (files) {
    var map = {};
    
    _.each(files, function(value) {
      map[fixtures[value].key] = fixtures[value].data;
    });
    
    return map;
  };

tests = {
  'compare empty': function () {
    var output = envoy.compare({}, {});
    
    assert.deepEqual(output.different, {});
    assert.deepEqual(output.deleted, {});
    assert.deepEqual(output.unchanged, {});
    assert.deepEqual(output.hashes, {});
  }
  
, 'compare new fileOne': function () {
    var output = envoy.compare({}, fixturesToMap(['fileOne']));
    
    assert.deepEqual(output.different, fixturesToMap(['fileOne']));
    assert.deepEqual(output.deleted, {});
    assert.deepEqual(output.unchanged, {});
    assert.deepEqual(output.hashes, fixtures.fileOneDiff);
  }
  
, 'compare new fileTwo': function () {
    var output = envoy.compare({}, fixturesToMap(['fileTwo']));
    
    assert.deepEqual(output.different, fixturesToMap(['fileTwo']));
    assert.deepEqual(output.deleted, {});
    assert.deepEqual(output.unchanged, {});
    assert.deepEqual(output.hashes, fixtures.fileTwoDiff);
  }
  
, 'compare new fileOne and fileTwo': function () {
    var output = envoy.compare({}, fixturesToMap(['fileOne','fileTwo']));
    
    assert.deepEqual(output.different, fixturesToMap(['fileOne','fileTwo']));
    assert.deepEqual(output.deleted, {});
    assert.deepEqual(output.unchanged, {});
    assert.deepEqual(output.hashes, _.extend({}, fixtures.fileOneDiff, fixtures.fileTwoDiff));
  }
  
, 'compare modified fileOne': function () {
    var output = envoy.compare(fixtures.fileOneDiff, fixturesToMap(['fileOneModified']));
    
    assert.deepEqual(output.different, fixturesToMap(['fileOneModified']));
    assert.deepEqual(output.deleted, {});
    assert.deepEqual(output.unchanged, {});
    assert.deepEqual(output.hashes, fixtures.fileOneModifiedDiff);
  }
  
, 'compare deleted fileOne': function () {
    var output = envoy.compare(fixtures.fileOneDiff, {});
    
    assert.deepEqual(output.different, {});
    assert.deepEqual(output.deleted, [fixtures.fileOne.key]);
    assert.deepEqual(output.unchanged, {});
    assert.deepEqual(output.hashes, {});
  }
  
, 'compare unmodified fileOne': function () {
    var output = envoy.compare(fixtures.fileOneDiff, fixturesToMap(['fileOne']));
    
    assert.deepEqual(output.different, {});
    assert.deepEqual(output.deleted, {});
    assert.deepEqual(output.unchanged, fixturesToMap(['fileOne']));
    assert.deepEqual(output.hashes, fixtures.fileOneDiff);
  }
  
, 'compare replace fileOne with fileTwo': function () {
    var output = envoy.compare(fixtures.fileOneDiff, fixturesToMap(['fileTwo']));
    
    assert.deepEqual(output.different, fixturesToMap(['fileTwo']));
    assert.deepEqual(output.deleted, [fixtures.fileOne.key]);
    assert.deepEqual(output.unchanged, {});
    assert.deepEqual(output.hashes, fixtures.fileTwoDiff);
  }
  
, 'compare add fileTwo alongside fileOne': function () {
    var output = envoy.compare(fixtures.fileOneDiff, fixturesToMap(['fileOne','fileTwo']));
    
    assert.deepEqual(output.different, fixturesToMap(['fileTwo']));
    assert.deepEqual(output.deleted, {});
    assert.deepEqual(output.unchanged, fixturesToMap(['fileOne']));
    assert.deepEqual(output.hashes, _.extend({}, fixtures.fileOneDiff, fixtures.fileTwoDiff));
  }
};

module.exports = tests;