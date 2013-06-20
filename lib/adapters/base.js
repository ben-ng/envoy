/**
* The base adapter provides common filesystem functionality
* Just implement the lower level functions and you're good
* The caching functions will help performance, look at the
* FTP adapter for an idea of how they work
*/
(function () {
  var BaseAdapter = function () {
    var async = require('async')
      , _ = require('underscore')
      , path = require('path');
      //, isWindows = process.platform === "win32";
      //path.sep = path.sep || (isWindows ? '\\' : '/');
      
      path.sep = path.sep || '/';
      
      /*
      * Set this to true in your before method
      */
      this.isReady = false;
      
      //Set to false if you want to see all the underlying calls
      //jsftp also has a DEBUG_MODE flag you can set manually to see the raw FTP commands
      this.quiet = true;
      
      this.debugIndent = 2;
      
      this.debug = function (msg) {
        //http://roguejs.com/2011-11-30/console-colors-in-node-js/
        var red   = '\033[31m'
          , blue  = '\033[36m'
          , green  = '\033[32m'
          , white  = '\033[37m'
          , reset = '\033[0m'
          , color;
        
        switch(this.debugIndent) {
          case 2:
            color = blue;
          break;
          case 3:
            color = red;
          break;
          case 4:
            color = green;
          break;
          default:
            color = white;
          break;
        }
        
        if(!this.quiet) {
          console.log((new Array(this.debugIndent)).join("  ") + color + msg + reset);
        }
      };
      
      /*
      * Cache directories that we know to exist
      * This saves us extra calls on each PUT, and adds up over time
      */
      this.dirCache = {};
      this.acknowledgeDir = function (dirName) {
        dirName = this.normalize(dirName);
        
        this.debugIndent++;
        this.debug("Cached " + dirName);
        this.debugIndent--;
        
        this.dirCache[dirName] = true;
      };
      this.disavowDir = function (dirName) {
        dirName = this.normalize(dirName);
        
        this.debugIndent++;
        this.debug("Uncached " + dirName);
        this.debugIndent--;
        
        delete this.dirCache[dirName];
      };
      this.dirExists = function (dirName) {
        dirName = this.normalize(dirName);
        
        var yes = this.dirCache[dirName] === true;
        
        if(yes) {
          this.debugIndent++;
          this.debug("Cache Used For" + dirName);
          this.debugIndent--;
        }
        return ;
      };
      //End caching functions
      
      /**
      * Normalizes file paths more consistently than node's native module
      * @param {string} filePath - The path to normalize
      * @param {string} [ftpSafe] - Safe for FTP commands
      * @return {string} The normalized path
      */
      this.normalize = function(filePath, ftpSafe) {
        var splitted
          , isFile
          , ftpSafe = (ftpSafe === true)
          //FIXME: Urgh!
          , specialCase = false;
        
        if(filePath.length === 0 || filePath === '.' || filePath === './') {
          specialCase = true;
          filePath = '.' + path.sep;
        }
        
        if(!specialCase && filePath === '/') {
          specialCase = true;
        }
        
        if(!specialCase) {
          filePath = path.normalize(filePath);
          
          //Remove trailing slashes and dots
          filePath = filePath.replace(/(\/|\.)+$/,'');
          
          //Does it start with a slash or dot?
          switch(filePath.charAt(0)) {
            case path.sep:
            break;
            case '.':
            default:
              if(filePath.charAt(1) !== path.sep) {
                filePath = '.' + path.sep + filePath;
              }
          }
          
          //Remove trailing slash for anything with a file extension
          //Add one for anything without
          splitted=filePath.split(path.sep).pop();
          isDir = splitted.indexOf('.') < 0;
          
          if(isDir) {
            filePath = filePath + path.sep;
          }
        }
        
        if(ftpSafe) {
          //FIXME: pure-ftpd Will refuse to stat stuff beginning with './', so drop it.
          if(filePath.indexOf('./') === 0) {
            filePath = filePath.substring(2);
          }
          
          //Fix for ./
          if(filePath === '') {
            filePath = '.';
          }
        }
        
        return filePath;
      };
      
      /**
       * @callback walkHandler
       * @param {string} path - The current path
       * @param {callback} next - Call this function to continue execution, pass error as first argument to stop.
       */
      
      /**
      * Walks down a path and calls a handler on each directory it encounters
      * Useful for recursively creating directories
      * @param {string} filePath - Path to a file or directory
      * @param {walkHandler} handler - A function to call on each directory visited
      * @param {int} [skip] - The number of levels to skip from the root, optional.
      * @param {callback} after - Called on error or after the entire operation is complete
      * e.g.: handlePath('somewhere/over/the/rainbow/file.txt')
      * -> handler('./', next)
      * -> handler('somewhere/', next)
      * -> handler('somewhere/over/', next)
      * -> handler('somewhere/over/the/', next)
      * -> handler('somewhere/over/the/rainbow/', next)
      */
      
      this.handlePath = function (filePath, handler, after) {
        filePath = path.normalize(filePath);
        
        var absolute = (filePath.charAt(0) === path.sep)
          , pieces = filePath.split(path.sep)
          , paths = absolute ? ['/'] : ['./']
          , workers = [];
        
        //Build paths
        _.each(pieces, function (piece, index) {
          var fullPath = path.join(paths[paths.length - 1], piece) + path.sep
            , isLastPiece = (index === pieces.length-1)
            , isFilePiece = piece.length>1 && piece.indexOf('.') >= 0;
          
          if(
            piece.length > 0 &&
            !(isLastPiece && isFilePiece)
          ) {
            paths.push(fullPath);
          }
        });
        
        //Build workers
        _.each(paths, function(aPath) {
          workers.push(function (next) {
            handler(aPath, next);
          });
        });
        
        //Run in series
        async.series(workers, after);
      };
      
      /**
      * Walks up a path and calls a handler on each directory it encounters
      * Useful for recursively deleting directories
      * Not optimized at all as it's only used for testing. The goal was just to be a mirror image of handlePath.
      * @param {string} filePath - Path to a file or directory
      * @param {walkHandler} handler - A function to call on each directory visited
      * @param {callback} after - Called on error or after the entire operation is complete
      * e.g.: handlePath('somewhere/over/the/rainbow/file.txt')
      * -> handler('./somewhere/over/the/rainbow/', next)
      * -> handler('./somewhere/over/the/', next)
      * -> handler('./somewhere/over/', next)
      * -> handler('./somewhere/', next)
      * -> handler('.', next)
      */
      this.handlePathBackwards = function (filePath, handler, after) {
        var buffer = []
          , makeHandler = function (path) {
              return function (next) {
                handler(path, next);
              };
            }
          , dummyHandler = function (path, next) {
            buffer.unshift(makeHandler(path));
            next();
          };
        
        this.handlePath(filePath, dummyHandler, function (err) {
          if(err) {
            after(err);
          }
          else {
            async.series(buffer, after);
          }
        });
      };
      
      /**
      * Ensures that a path exists, helpful before any put/get operation
      */
      this.ensurePath = function (filePath, cb) {
        
        //Base case. We were given a filename alone.
        if(filePath.indexOf(path.sep) < 0 && filePath.indexOf('.') !== 0) {
          this.acknowledgeDir(filePath);
          
          cb();
          return;
        }
        
        filePath = this.normalize(filePath);
        
        var self = this
          , oldCb = cb
          , finalFileExists = false
          , verifyHandler = function (curDir, next) {
            
            curDir = self.normalize(curDir);
        
            //Try listing the directory
            if(self.dirExists(curDir)) {
              //Dir already exists
              next();
            }
            else { 
              //List the parent directory
              self.list(curDir, function (err, results) {
                var remainingDir = filePath.substring(curDir.length)
                  , nextDir = remainingDir.replace(/^\//,'').split(path.sep).shift()
                  , nextPath = self.normalize(path.join(curDir,nextDir))
                  , entry
                  , foundFileType
                  , iter = function (file) {
                      if(!file) {
                        return false;
                      }
                      else {
                        //Register in cache if it's a dir
                        if(file.type === 1) {
                          self.acknowledgeDir(path.join(curDir, file.name))
                        }
                        if(file.name === nextDir) {
                          foundFileType = file.type;
                          return true;
                        }
                        else {
                          return false;
                        }
                      }
                    };
                
                if(err) {
                  next(err);
                }
                else {
                  
                  //Base case
                  var proposal = self.normalize(path.join(curDir, nextDir));
                  
                  //Is the next directory in the current results?
                  entry = _.find(results, iter, this);
                  
                  //Is this the final directory?
                  if(proposal === filePath) {
                    finalFileExists = entry ? true : false;
                    next();
                  }
                  else {
                    if(!entry) {
                      //Dir does not exist
                      self.mkdir(nextPath, next);
                    }
                    else {
                      //Dir already exists
                      self.acknowledgeDir(nextPath)
                      next();
                    }
                  }
                }
              });
            }
          };
        
        /*
        * Debugging indents
        */
        oldCb = cb;
        cb = function (err) {
          self.debugIndent--;
          oldCb.apply(self, [err, finalFileExists]);
        };
        self.debugIndent++;
        
        self.handlePath(filePath, verifyHandler, cb);
      };
      
      /**
      * Delete empty directories along the path, useful after a destroy command
      */
      this.trimPath = function (filePath, cb) {
        filePath = this.normalize(filePath);
        
        var self = this
          , cleanHandler = function (curDir, next) {
              
            curDir = self.normalize(curDir);
        
            //Base case. We were given the root directory
            if(curDir === '/' || curDir === './') {
              next(null);
              return;
            }
            else {
              //Try listing the directory
              self.list(curDir, function (err, results) {
                if(err) {
                  next(err);
                }
                else {
                  results = _.filter(results, function (item) {
                    return item ? true : false;
                  });
                  
                  if(results.length == 0) {
                    //Dir is empty
                    self.rmdir(path.join(curDir), next);
                  }
                  else {
                    //Dir already exists
                    next();
                  }
                }
              });
            }
          };
        
        self.handlePathBackwards(filePath, cleanHandler, cb);
      };
  };
  
  module.exports = new BaseAdapter();
}());