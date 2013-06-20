(function () {
  var _ = require('underscore')
    , FtpAdapter = function () {
      var jsftp = require('jsftp')
        , async = require('async')
        , path = require('path');
        
        this.mkdir = function (filePath, cb) {
          var self = this;
          filePath = this.normalize(filePath, true);
          
          this.debug("MKDIR " + filePath);
          
          ftp.raw.mkd(filePath, function(err) {
            if(err) {
              cb("MKDIR '" + filePath + "' failed with error " + err.code);
            }
            else {
              self.acknowledgeDir(filePath);
              cb(null);
            }
          });
        };
        
        this.rmdir = function (filePath, cb) {
          var self = this;
          filePath = this.normalize(filePath, true);
          
          this.debug("RMDIR " + filePath);
          
          if(filePath == './' || filePath == '/') {
            cb("Unsafe DEL on " + filePath + " was aborted");
          }
          else {
            ftp.raw.rmd(filePath, function(err) {
              if(err) {
                cb("RMDIR '" + filePath + "' failed with error " + err.code);
              }
              else {
                self.disavowDir(filePath);
                cb(null);
              }
            });
          }
        };
        
        this.list = function (filePath, cb) {
          filePath = this.normalize(filePath, true);
          
          this.debug("LIST " + filePath);
          
          ftp.ls(filePath, function(err, data) {
            if(err) {
              cb("LIST '" + filePath + "' failed with error " + err.code);
            }
            else {
              cb(null, data);
            }
          });
        };
        
        this.put = function (filePath, data, cb) {
          filePath = this.normalize(filePath, true);
          
          this.debug("PUT " + filePath);
          
          this.ensurePath(filePath, function(err) {
            if(err) {
              cb(err);
            }
            else {
              ftp.put(filePath, data, function(err) {
                if(err) {
                  cb("PUT failed with error " + err.code);
                }
                else {
                  cb(null);
                }
              });
            }
          });
        };
        
        this.get = function (filePath, cb) {
          filePath = this.normalize(filePath);
          
          this.debug("GET " + filePath);
          
          
          this.ensurePath(filePath, function(err, exists) {
            if(err) {
              cb(err);
            }
            else {
              if(!exists) {
                cb(null, false);
              }
              else {
                ftp.get(filePath, function(err, data) {
                  if(err) {
                    cb("GET failed with error " + err.code);
                  }
                  else {
                    cb(null, data);
                  }
                });
              }
            }
          });
        };
        
        this.destroy = function (filePath, cb) {
          var self = this;
          
          filePath = this.normalize(filePath, true);
          
          this.debug("DELETE " + filePath);
          
          ftp.raw.dele(filePath, function(err) {
            if(err) {
              cb("DELETE failed with error " + err.code);
            }
            else {
              self.trimPath(filePath, cb);
            }
          });
        };
        
        this.before = function (opts, cb) {
          var self = this
            , clientOnConnect = function () {
               ftp.auth(opts.username, opts.password, function(err) {
                 if(err) {
                   cb(err);
                 }
                 else {
                   self.isReady = true;
                   cb(null);
                 }
               });
              };
          
          try {
            ftp = new jsftp(_.extend({}, opts, {
              onConnect:clientOnConnect
            , onError: function(err) {
                cb("Failed to initialize adapter: "+err)
              }
            }));
          }
          catch (e) {
            cb("Failed to initialize adapter: "+e)
            return;
          }
        };
        
        this.after = function (cb) {
          var self = this;
          
          ftp.raw.quit(function(err, res) {
            if(err) {
              cb("QUIT failed with error " + err.code);
            }
            else {
              self.isReady = false;
              cb(null);
            }
          });
        };
    }
    , base = require('./base')
    , client = new FtpAdapter();
  
  _.extend(client, base);
  
  module.exports = client;
}());