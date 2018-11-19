var fs = require('fs');
var extract = require('..');

var ipa = process.argv[2];
var fd = fs.openSync(ipa, 'r');

extract(fd, function(err, info, raw, icon){
  if (err) throw err;
  console.log(info);
  console.log(icon);

	fs.writeFile("./icon2.png", icon,  "binary",function(err) {
		if(err) {
		    console.log(err);
		} else {
		    console.log("The file was saved!");
		}
	});
});
