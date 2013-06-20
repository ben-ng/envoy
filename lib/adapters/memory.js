(function () {
  var _ = require('underscore')
    , MemoryAdapter = function () {
      this.store = {};
    
      this.put = function (path, data, cb) {
        this.store[path] = data;
        cb(null);
      };
      
      this.get = function (path, cb) {
        cb(null, this.store[path]);
      };
      
      this.destroy = function (path, cb) {
        delete this.store[path];
        
        cb(null);
      };
      
      this.before = function (opts, cb) {
        this.isReady = true;
        cb(null);
      };
      
      this.after = function (cb) {
        this.isReady = false;
        cb(null);
      };
    }
  , base = require('./base')
  , client = new MemoryAdapter();
  
  _.extend(client, base);
  
  module.exports = client;
}());