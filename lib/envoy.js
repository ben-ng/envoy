(function () {
  var _ = require('underscore')
    , path = require('path')
    , fs = require('fs')
    , wrench = require('wrench')
    , async = require('async')
    , Envoy = function (persistenceFile) {
    
    /*
    * Where do we store the diffs?
    */
    this.persistenceFile = persistenceFile ? persistenceFile : '.envoy';
    
    /**
     * @callback callback
     * @param {null|string} err - null if no error
     * @param {mixed} data - Data from the call, if any
     */
    
    /**
    * Compares the dictionary of diffs (existing files) to the array of files to be published
    * @param {object} diffs - A dictionary in the format {'/file/path':'sha1hash', ...} representing the previous known state
    * @param {array} files - The collection of files to be uploaded in the format {key: data}]
    * @return {object} - The comparison output in the format {different: {key: data, ...}, deleted: ['path', ...], unchanged: {key: data, ...}, diffs: {key:hash, ...}}
    */
    this.compare = function (diffs, files) {
      var crypto = require('crypto')
        , changedOrNewFiles = {}
        , similarFiles = {}
        , deletedFiles = []
        , hashSums = {}
        , i
        , ii
        , hash
        , key;
      
      if (diffs === undefined || diffs === null) {
        diffs = {};
      }
      else {
        diffs = _.extend({}, diffs)
      }
      
      //Calculate hashes for each file
      _.each(files, function(data, key) {
        hash = crypto.createHash('sha1');
        hash.update(data);
        hashSums[key] = hash.digest('hex');
      });
      
      //Loop through each key in the new array
      _.each(files, function(data, key) {
        if (diffs[key]) {
          //Does the key exist in the old copy?
          if (diffs[key] === hashSums[key]) {
            //If the diffs match, there is nothing to be done here -- shift it to the similar list
            similarFiles[key] = data;
          } else {
            //Existing file, but updated
            changedOrNewFiles[key] = data;
          }
        } else {
          //This is definitely a new file
          changedOrNewFiles[key] = data;
        }
        files[key] = null;
        delete files[key];
        delete diffs[key];
      });
      
      //Determine what files were deleted
      _.each(diffs, function(data, key) {
        deletedFiles.push(key);
      });
      
      return {
        different: changedOrNewFiles,
        deleted: deletedFiles,
        unchanged: similarFiles,
        hashes: hashSums
      };
    };
    
    /**
    * Deploys a folder to the specified service
    * @param {string} sources - Path to the source files
    * @param {string} strategy - The deployment strategy to use
    * @param {string} [opts] - Options like login details specific to the strategy
    * @param {callback} cb - The function to execute after deployment
    */
    this.deployFolder = function (sources, strategy, opts, cb) {
      var self = this
        , files = []
        , filter = function (item) {
            return item.stat.isFile();
          };
      
      if(!cb) {
        cb = opts;
        opts = {};
      }
      
      opts = this.readyOpts(opts);
      
      this.filterAndReadFiles(sources, filter, function(err, files) {
        if(err) {
          cb(err);
        }
        else {
          //Delegate to deployCollection
          self.deployCollection(files, strategy, opts, cb);
        }
      });
    };
    
    /**
    * Deploys a collection of files to the specified service
    * @param {string} sources - Map of source files, without directories {path: Buffer<Data> ...}
    * @param {string|client} strategy - The deployment strategy to use. Pass in a client object to use it.
    * @param {string} [opts] - Options like login details specific to the strategy
    * @param {callback} cb - The function to execute after deployment
    */
    this.deployCollection = function (sources, strategy, opts, cb) {
      var self = this
        , client = this.clientFromStrategy(strategy);
      
      sources = _.extend({}, sources);
      
      opts = this.readyOpts(opts);
      
      //If we already have data just use it
      if(opts.persistenceData) {
        self.deploy(sources, client, opts, cb);
      }
      //Load persistence data from the server first
      else {
        this.loadPersistenceData(strategy, opts, function (err, client, newOpts) {
          if(err) {
            cb(err);
          }
          else {
            self.deploy(sources, client, newOpts, cb);
          }
        });
      }
    };
    
    /**
    * Does the actual deployment
    */
    this.deploy = function (sources, strategy, opts, cb) {
      var diff
        , client = this.clientFromStrategy(strategy)
        , workers = []
        , put
        , destroy;
      
      if(!cb) {
        cb = opts;
        opts = {};
      }
      
      opts = this.readyOpts(opts);
      
      //Helper functions that add tasks
      put = function(filePath, data) {
        
        filePath = path.join(opts.baseDir, filePath);
        
        return function (next) {
          client.put(filePath, data, function (err) {
            if(err) {
              next(err);
            }
            else {
              next(null, 'PUT '+filePath);
            }
          });
        };
      };
      
      destroy = function(filePath) {
        
        filePath = path.join(opts.baseDir, filePath);
        
        return function (next) {
          client.destroy(filePath, function (err) {
            if(err) {
              next(err);
            }
            else {
              next(null, 'DEL '+filePath);
            }
          });
        };
      };
      
      //Diff with persistence file
      diff = this.compare(opts.persistenceData, sources);
      
      //Add persistance data
      workers.push( put(this.persistenceFile, new Buffer(JSON.stringify(diff.hashes))) );
      
      //Add upload tasks
      _.each(diff.different, function (data, key) {
        workers.push( put(key, data) );
      });
      
      //Add delete tasks
      _.each(diff.deleted, function (key) {
        workers.push( destroy(key) );
      });
      
      //This task destroys the adapter
      workers.push(function (next) {
        client.after(function (err, data) {
          if(err) {
            next(err);
          }
          else {
            next(null, "Adapter Closed");
          }
        });
      });
      
      //Execute all tasks, send results to callback function
      async.series(workers, function (err, log) {
        if(err) {
          cb(err);
        }
        else {
          cb(null, opts.logs.concat(log), diff.hashes);
        }
      });
    }
    
    /**
    * Undeploys a site from the specified service
    * @param {string} sources - Map of source files, without directories {path: Buffer<Data> ...}
    * @param {string} strategy - The deployment strategy to use
    * @param {string} [opts] - Options like login details specific to the strategy
    * @param {callback} cb - The function to execute after deployment
    */
    this.undeploy = function (strategy, opts, cb) {
      var self = this;
      
      this.loadPersistenceData(strategy, opts, function (err, client, newOpts) {
        //Deploy an empty site to wipe out the old stuff
        self.deployCollection({}, client, newOpts, cb);
      });
    };
    
    //Normalizes options
    this.readyOpts = function(opts) {
      opts = _.extend({}, opts);
      opts.persistenceData = opts.persistenceData || false;
      opts.baseDir = opts.baseDir || './';
      opts.initialRun = opts.persistenceData ? false : true;
      opts.logs = opts.logs || [];
      
      return opts;
    }
    
    /**
     * @callback persistCallback
     * @param {null|string} err - null if no error
     * @param {object} client - The client adapter
     * @param {object} opts - Options hash with updated persistenceData
     */
    
    /**
    * Loads the persistence data from the server
    * @param {persistCallback} The function to execute after persistence data is loaded
    */
    this.loadPersistenceData = function (strategy, opts, cb) {
      var self = this
        , client = this.clientFromStrategy(strategy)
        , persistenceFilePath
        , wasOpened = false
        , afterReady = function () {
            client.get(persistenceFilePath, function(err, data) {
              if(err) {
                cb(err);
              }
              else {
                try {
                  opts.persistenceData = JSON.parse(data);
                }
                catch (e) {
                  opts.persistenceData = {};
                }
                
                if(wasOpened) {
                  opts.logs.push('Adapter Opened');
                }
                
                opts.logs.push('GET ' + persistenceFilePath);
                
                cb(null, client, opts);
              }
            });
          };
        
      opts = this.readyOpts(opts);
      persistenceFilePath = path.join(opts.baseDir, self.persistenceFile)
      
      //Fetch persistence file from server
      if(client.isReady) {
        afterReady();
      }
      else {
        client.before(opts, function (err) {
          if(err) {
            cb(err);
          }
          else {
            wasOpened = true;
            afterReady();
          }
        });
      }
    };
    
    //Requires the adapter if not already initialized
    this.clientFromStrategy = function (strategy) {
      var client;
      
      if(typeof strategy === 'object') {
        client = strategy;
        strategy = false;
      }
      else {
        //Try loading adapter
        try {
          client = new require( path.join(__dirname,'adapters',strategy) );
        }
        catch(e) {
          throw(new Error("Could not load the "+ strategy + " adapter: " + e));
        }
      }
      
      return client;
    }
    
    /*
    * Finds persistence file in source map
    * Not very useful, really..
    */
    this.findPersistenceFile = function(map) {
      var self = this
        , finder = function (data, filePath) {
          return filePath.lastIndexOf(self.persistenceFile) === filePath.length - self.persistenceFile.length;
        };
      
      return _.find(map, finder);
    };
    
    /**
     * @filter filter
     * @param {object} Data - {stat:fs.stat(), path:"fileName"} 
     * @return {bool} Return true to keep and false to filter out
     */
    
    /**
    * Recursively walks a directory and applies a filter
    * @param {string} source - Path to the source directory
    * @param {filter} filter - A function to filter
    * @param {callback} callback - err, filePaths
    */
    this.filterAndReadFiles = function (source, filter, cb) {
      var self = this
        , files = []
        , getStat = function (filePath) {
            return function (next) {
              fs.stat(path.join(source, filePath), function (err, stat) {
                if(err) {
                  next(err);
                }
                else {
                  next(null, {
                    path: filePath
                  , stat: stat
                  });
                }
              });
            };
          }
        , statWorkers = [];
      
      wrench.readdirRecursive(source, function(err, curFiles) {
        if(err) {
          cb(err);
        }
        else {
          if(curFiles) {
            files = files.concat(curFiles);
          }
          else {
            _.each(files, function (item) {
              statWorkers.push( getStat(item) );
            });
            
            //Get stats of each file
            async.parallel(statWorkers, function (err, statFiles) {
              if(err) {
                cb(err);
              }
              else {
                //Run the filter function on the collection
                statFiles = _.filter(statFiles, filter);
                
                //Read the remaining files
                self.readFilesIntoMap(source, statFiles, cb);
              }
            });
          }
        }
      });
    }
    
    //Reads files into a map
    this.readFilesIntoMap = function (root, filePaths, cb) {
      var readFile = function (filePath) {
            return function (next) {
              fs.readFile(path.join(root, filePath), function (err, data) {
                next(err, {path: filePath, data: data});
              });
            };
          }
        , fileReaders = []
        , map = {};
      
      _.each(filePaths, function (data) {
        fileReaders.push( readFile(data.path) );
      });
      
      async.parallel(fileReaders, function(err, files) {
        if(err) {
          cb(err);
        }
        else {
          _.each(files, function (file) {
            map[file.path] = file.data;
          });
          
          cb(null, map);
        }
      });
    };
  }
  , kitty = new Envoy();
  
  // if we've got a window and we don't have a module
  // create a global;
  if ((typeof window != 'undefined') && (typeof module == 'undefined')) {
    window.envoy = kitty;
  }
  // otherwise, export it.
  else {
    module.exports = kitty;
  }
}());