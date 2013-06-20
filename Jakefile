var t = new jake.TestTask('envoy', function () {
  var fs = require('fs')
  , fileList = [
      'tests/compare.js'
    , 'tests/adapters/*.js'
    , 'tests/deployment.js'
    ]
  , fixtureDir = "./tests/fixtures/sites/1";
  
  process.env.SECRETS_FILE = process.env.SECRETS_FILE || './secrets';
  
  //Create empty test dir if needed
  if(!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir);
  }
  
  this.testFiles.include(fileList);
  this.testFiles.exclude('tests/secrets.js');
  this.testFiles.exclude('tests/fixtures.js');
});

task('testWith', {async: true}, function (type) {
  var init = jake.Task.test;
  
  if(!type) {
    type = '';
  }
  else {
    type = '.' + type
  }
  
  process.env.SECRETS_FILE = './secrets'+type;
  
  init.addListener('complete', function () {
    complete();
  });
  init.invoke();
});