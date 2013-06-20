#Envoy
Fast, simple deployment of static sites.

[![Build Status](https://travis-ci.org/ben-ng/envoy.png?branch=master)](https://travis-ci.org/ben-ng/envoy)

##Goals
 * **Correctness:** Deployed sites should be exactly as they were on the local filesystem.
 * **Speedy:** Perform the bare minimum number of operations without compromising correctness.
 * **Simple:** One command should be all it takes to deploy to any service.

##Supported Services
 * FTP
 * S3 *(Soon...)*
 * Github Pages *(Soon...)*

##High-Level Calls
```js

var envoy=require('envoy')
  , ftpOptions = {
      username: 'Fluffy'
    , password: 'McChubbers'
    , host:     'ftp.cheeseburger.com'
    }
  , simpleWebsite = {
      "index.html": '<h1>Welcome, Humans!</h1>'
    }
  , afterDeploy = function (err, log) {
    if(err) {
      console.err("Uh-oh: " + err);
    }
    else {
      console.log("Website Deployed!");
      
      console.log("Deployment log:");
      for(var i=0, ii=log.length; i<ii; i++) {
        console.log(log[i]);
      }
    }
  };

// Deploying a local folder to FTP
envoy.deployFolder('./my-website-folder', 'ftp', ftpOptions, afterDeploy);

// Deploying a collection of files to FTP
envoy.deployCollection(simpleWebsite, 'ftp', ftpOptions, afterDeploy);

```

##Low-Level Calls

You can perform lower level calls with the adapters directly.

```js
  var client = new require('./lib/adapters/ftp')
    , opts = {username:'donkey', password:'kong'};
  
  client.before(opts, function (err) {
  
    client.put('some_file.txt', new Buffer('Some Data'), function (err) {
    
      client.after( function (err) {
        console.log("Done!");
      } );
      
    });
    
  });
```

All adapters support three operations
 * before
 * put
 * get
 * destroy
 * after

Certain adapters like FTP will support more operations unique to their operation
 * mkdir
 * rmdir
 * list

Take a look at the tests for more.

##Notes
 * We leave a `.envoy` file in the remote directory to speed up future deploys. Make sure your FTP server is configured to show dotfiles.

##Testing
You need a `tests/secrets.json` file to run integration tests on your own server. See `tests/secrets.example.json` for an example.

 * FTP
    * Ensure user has write permissions
    * Server should be configured to show .dotfiles
    * Server should not auto-rename uploaded files on conflict
    * We are tested against pure-ftpd and vsftpd