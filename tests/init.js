(function () {
  var _ = require('underscore')
    , secrets = require(process.env.SECRETS_FILE)
    , adapters = []
    , uuid
    //Add to this array new adapters to test
    , opts = {
        memory: {}
      , s3: secrets.s3
      , ftp: secrets.ftp
      }
    , b = function (
        a                  // placeholder
      ){
        return a           // if the placeholder was passed, return
          ? (              // a random number from 0 to 15
            a ^            // unless b is 8,
            Math.random()  // in which case
            * 16           // a random number from
            >> a/4         // 8 to 11
            ).toString(16) // in hexadecimal
          : (              // or otherwise a concatenated string:
            [1e7] +        // 10000000 +
            -1e3 +         // -1000 +
            -4e3 +         // -4000 +
            -8e3 +         // -80000000 +
            -1e11          // -100000000000,
            ).replace(     // replacing
              /[018]/g,    // zeroes, ones, and eights with
              b            // random hex digits
            )
      }
    /*
    * https://gist.github.com/jed/982883
    * Use a unique folder for each test
    * otherwise adapters like s3 will probably collide
    */
    , uuid = b();
  
  _.each(opts, function (adapterOpts, adapter) {
    adapters.push(adapter.toLowerCase());
    _.extend(adapterOpts, {baseDir:'./'+uuid});
  });
  
  //Load s3 configuration from travis if possible
  if(process.env.TRAVIS_SECURE_ENV_VARS) {
    _.extend(opts.s3,{
      key: process.env.AWS_S3_KEY
    , secret: process.env.AWS_S3_SECRET
    , bucket: process.env.AWS_S3_BUCKET
    , region: process.env.AWS_S3_REGION
    });
  }
  
  module.exports = {
    uuid: uuid
  , opts: opts
  , adapters: adapters
  };
}());