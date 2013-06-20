var assert = require('assert')
  , _ = require('underscore')
  , tests = []
  , envoy = require('../lib/envoy.js')
  , secrets = require('./secrets')
  , fixtures = require('./fixtures')
  , adapters = ["memory", "ftp"]
  , undeployOpts
  , opts = {
      memory: {
        baseDir:'./tests'
      }
    , ftp: secrets.ftp
    }
  , undeploy = function () {
      
    };

_.extend(opts.ftp, {baseDir:'./tests'});

_.each(adapters, function (adapterName) {
  
  tests[adapterName + ' deploy/undeploy empty folder'] = function (next) {
    envoy.deployFolder(fixtures.siteOne, adapterName, opts[adapterName], function (err, log, hashes) {
      assert.equal(err, null, err);
      assert.deepEqual(log,['Adapter Opened','GET tests/.envoy','PUT tests/.envoy','Adapter Closed']);
      
      //Reverse the deployment to delete the site
      envoy.undeploy(adapterName, opts[adapterName], function (err, log) {
        assert.equal(err, null, err);
        
        assert.deepEqual(log,['Adapter Opened','GET tests/.envoy','PUT tests/.envoy','Adapter Closed']);
        
        next();
      });
    });
  };
  tests[adapterName + ' deploy/undeploy folder with file and image'] = function (next) {
    envoy.deployFolder(fixtures.siteTwo, adapterName, opts[adapterName], function (err, log) {
      assert.equal(err, null, err);
      
      assert.equal(log[0],'Adapter Opened');
      assert.equal(log[log.length - 1],'Adapter Closed');
      
      //need to sort as the order will be different on different systems/ftp servers
      assert.deepEqual(log.sort(),['Adapter Opened','GET tests/.envoy','PUT tests/.envoy','PUT tests/kitten.jpeg','PUT tests/kitten.txt','Adapter Closed'].sort());
      
      //Reverse the deployment to delete the site
      envoy.undeploy(adapterName, opts[adapterName], function (err, log) {
        assert.equal(err, null, err);
        
        assert.equal(log[0],'Adapter Opened');
        assert.equal(log[log.length - 1],'Adapter Closed');
        assert.deepEqual(log.sort(),['Adapter Opened','GET tests/.envoy','PUT tests/.envoy','DEL tests/kitten.jpeg','DEL tests/kitten.txt','Adapter Closed'].sort());
        
        next();
      });
    });
  };
  tests[adapterName + ' deploy/undeploy folder with subdirectory containing file'] = function (next) {
    envoy.deployFolder(fixtures.siteThree, adapterName, opts[adapterName], function (err, log) {
      assert.equal(err, null, err);
        
        assert.equal(log[0],'Adapter Opened');
        assert.equal(log[log.length - 1],'Adapter Closed');
        assert.deepEqual(log.sort(),['Adapter Opened','GET tests/.envoy','PUT tests/.envoy','PUT tests/a_subdirectory/kitten.txt','Adapter Closed'].sort());
      
      //Reverse the deployment to delete the site
      envoy.undeploy(adapterName, opts[adapterName], function (err, log) {
        assert.equal(err, null, err);
        
        assert.equal(log[0],'Adapter Opened');
        assert.equal(log[log.length - 1],'Adapter Closed');
        assert.deepEqual(log.sort(),['Adapter Opened','GET tests/.envoy','PUT tests/.envoy','DEL tests/a_subdirectory/kitten.txt','Adapter Closed'].sort());
        
        next();
      });
    });
  };
});

module.exports = tests;