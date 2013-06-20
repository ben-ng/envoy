var t = new jake.TestTask('envoy', function () {
  var fs = require('fs')
  , fileList = [
      'tests/compare.js'
    , 'tests/adapters/*.js'
    , 'tests/deployment.js'
    ]
  , fixtureDir = "./tests/fixtures/sites/1";
  
  //Create empty test dir if needed
  if(!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir);
  }
  
  this.testFiles.include(fileList);
  this.testFiles.exclude('tests/secrets.js');
  this.testFiles.exclude('tests/fixtures.js');
});