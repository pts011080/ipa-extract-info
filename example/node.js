var fs = require('fs');
var extract = require('..');

var ipa = process.argv[2];
var fd = fs.openSync(ipa, 'r');

// extract(fd, function(err, info, raw){
//   // if (err) throw err;
//   // console.log(info);
// });

var ipa = new extract(fd);

ipa.info(ipa.fd,function(err,info,src){
	if (err) {
		console.log('err: ',err);
	}else{
		console.log('info: ',info);
	}
});

ipa.icon(ipa.fd,function(err,icon){
	if (err) {
		console.log('err: ',err);
	}else{
		console.log('icon: ',icon);
		
		fs.writeFile("./icon.png", icon,  "binary",function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("The file was saved!");
	    }
		});
	}
});