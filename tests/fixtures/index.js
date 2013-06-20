var fixtures = {
  // Just a simple file
    "fileOne"             : {key:"good.txt",data:"a"}
  , "fileOneDiff"         : {"good.txt":"86f7e437faa5a7fce15d1ddcb9eaeaea377667b8"}
  // Modified to test updates
  , "fileOneModified"     : {key:"good.txt",data:"m"}
  , "fileOneModifiedDiff" : {"good.txt":"6b0d31c0d563223024da45691584643ac78c96e8"}
  // Now with dashes
  , "fileTwo"             : {key:"b-a-d.txt",data:"b"}
  , "fileTwoDiff"         : {"b-a-d.txt":"e9d71f5ee7c92d6dc9e92ffdad17b8bd49418f98"}
  // And under a subdirectory
  , "fileThree"           : {key:"sub/directory/file.txt",data:"f"}
  , "fileThreeDiff"       : {"sub/directory/file.txt":"4a0a19218e082a343a1b17e5333409af9d98f0f5"}
  // A lone dotfile
  , "fileFour"            : {key:".dotfile",data:"f"}
  , "fileFourDiff"        : {".dotfile":"4a0a19218e082a343a1b17e5333409af9d98f0f5"}
  // A tricky directory named like a dotfile
  , "fileFive"            : {key:".dotfile/query.txt",data:"f"}
  , "fileFiveDiff"        : {".dotfile/query.txt":"4a0a19218e082a343a1b17e5333409af9d98f0f5"}
  // A dotfile in a directory
  , "fileSix"             : {key:"test/.dotfile",data:"f"}
  , "fileSixDiff"         : {"test/.dotfile":"4a0a19218e082a343a1b17e5333409af9d98f0f5"}
  // A website with no files
  , "siteOne"             : "./tests/fixtures/sites/1"
  // A simple website with one text file and one image
  , "siteTwo"             : "./tests/fixtures/sites/2"
  // A simple website with one file in a subdirectory
  , "siteThree"           : "./tests/fixtures/sites/3"
  // A simple website as a collection
  , "collectionSite"      : {'siteroot/index.html': (new Buffer("<h1>It Worked!</h1>"))}
};
  
module.exports = fixtures;