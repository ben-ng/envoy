(function () {
  var _ = require('underscore')
    , knox = require('knox')
    , mime = require('mime')
    , concat = require('concat-stream')
    , S3Adapter = function () {
      this.store = {};

      this.knox = null;

      this.put = function (path, data, cb) {
        var headers = {
          'Content-Type': mime.lookup(path)
        , 'x-amz-acl': 'public-read'
        };
        this.knox.putBuffer(data, path, headers, function(err, resp){
          if (err) {
            cb(err);
            return
          }

          resp.pipe(concat(function (data) {
            data = data.toString();

            if (data.indexof('<Error>') > -1) {
              cb(data);
            }
            else {
              cb(null);
            }
          }));
        });
      };

      this.get = function (path, cb) {
        this.knox.get(path).on('response', function(res){
          res.setEncoding('utf8');

          res.pipe(concat(function(data) {
            cb(null, data)
          }));
        }).end();
      };

      this.destroy = function (path, cb) {
        this.knox.deleteFile(path, function(err) {
          cb(err);
        });
      };

      this.before = function (opts, cb) {
        this.knox = knox.createClient({
          key: opts.key
        , secret: opts.secret
        , bucket: opts.bucket
        });
        this.isReady = true;
        cb(null);
      };

      this.after = function (cb) {
        this.isReady = false;
        cb(null);
      };
    }
  , base = require('./base')
  , client = new S3Adapter();

  _.extend(client, base);

  module.exports = client;
}());