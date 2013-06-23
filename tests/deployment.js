var assert = require('assert')
  , _ = require('underscore')
  , tests = []
  , envoy = require('../lib/envoy.js')
  , fixtures = require('./fixtures')
  , config = require('./init')
  , opts = config.opts
  , uuid = config.uuid
  , adapters = config.adapters
  , undeployOpts;

_.each(adapters, function (adapterName) {
  
  tests[adapterName + ' deploy/undeploy empty collection'] = function (next) {
    envoy.deployCollection({}, adapterName, opts[adapterName], function (err, log, hashes) {
      assert.equal(err, null, err);
      assert.deepEqual(log,['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','Adapter Closed']);
      
      //Reverse the deployment to delete the site
      envoy.undeploy(adapterName, opts[adapterName], function (err, log) {
        assert.equal(err, null, err);
        
        assert.deepEqual(log,['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','Adapter Closed']);
        
        next();
      });
    });
  };
  
  tests[adapterName + ' deploy/undeploy simple collection'] = function (next) {
    
    envoy.deployCollection(fixtures.collectionSite, adapterName, opts[adapterName], function (err, log, hashes) {
      assert.equal(err, null, err);
      assert.deepEqual(log,['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','PUT '+uuid+'/siteroot/index.html','Adapter Closed']);
      
      //Reverse the deployment to delete the site
      envoy.undeploy(adapterName, opts[adapterName], function (err, log) {
        assert.equal(err, null, err);
        
        assert.deepEqual(log,['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','DEL '+uuid+'/siteroot/index.html','Adapter Closed']);
        
        next();
      });
    });
  };
  
  tests[adapterName + ' deploy/undeploy empty folder'] = function (next) {
    envoy.deployFolder(fixtures.siteOne, adapterName, opts[adapterName], function (err, log, hashes) {
      assert.equal(err, null, err);
      assert.deepEqual(log,['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','Adapter Closed']);
      
      //Reverse the deployment to delete the site
      envoy.undeploy(adapterName, opts[adapterName], function (err, log) {
        assert.equal(err, null, err);
        
        assert.deepEqual(log,['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','Adapter Closed']);
        
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
      assert.deepEqual(log.sort(),['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','PUT '+uuid+'/kitten.jpeg','PUT '+uuid+'/kitten.txt','Adapter Closed'].sort());
      
      //Reverse the deployment to delete the site
      envoy.undeploy(adapterName, opts[adapterName], function (err, log) {
        assert.equal(err, null, err);
        
        assert.equal(log[0],'Adapter Opened');
        assert.equal(log[log.length - 1],'Adapter Closed');
        assert.deepEqual(log.sort(),['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','DEL '+uuid+'/kitten.jpeg','DEL '+uuid+'/kitten.txt','Adapter Closed'].sort());
        
        next();
      });
    });
  };
  tests[adapterName + ' deploy/undeploy folder with subdirectory containing file'] = function (next) {
    envoy.deployFolder(fixtures.siteThree, adapterName, opts[adapterName], function (err, log) {
      assert.equal(err, null, err);
        
        assert.equal(log[0],'Adapter Opened');
        assert.equal(log[log.length - 1],'Adapter Closed');
        assert.deepEqual(log.sort(),['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','PUT '+uuid+'/a_subdirectory/kitten.txt','Adapter Closed'].sort());
      
      //Reverse the deployment to delete the site
      envoy.undeploy(adapterName, opts[adapterName], function (err, log) {
        assert.equal(err, null, err);
        
        assert.equal(log[0],'Adapter Opened');
        assert.equal(log[log.length - 1],'Adapter Closed');
        assert.deepEqual(log.sort(),['Adapter Opened','GET '+uuid+'/.envoy','PUT '+uuid+'/.envoy','DEL '+uuid+'/a_subdirectory/kitten.txt','Adapter Closed'].sort());
        
        next();
      });
    });
  };
});

module.exports = tests;