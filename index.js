var fromFd = require('yauzl').fromFd;
var collect = require('collect-stream');
var bplistParse = require('bplist-parser').parseBuffer;
var plistParse = require('plist').parse;
var reg = require('./lib/reg');
var once = require('once');

var chrOpenChevron = 60;
var chrLowercaseB = 98;

const IPA = function(fd){
  this.fd = fd;
}

IPA.prototype.info = function (fd,cb){
  payload_file(reg.info,fd,function(err, src){
    if (err) {
      cb(err);
      throw err;
      return;
    }else if (src) {
      var obj;
      try {
        if (src[0] === chrOpenChevron) {
          obj = plistParse(src.toString());
        } else if (src[0] === chrLowercaseB) {
          obj = bplistParse(src);
        } else {
          return cb(new Error('unknown plist type %s', src[0]));
        }
      } catch (err) {
        return cb(err);
      }

      var infos = [].concat(obj);
      cb(null, infos[0], src);
    }
  });
}

IPA.prototype.icon = function (fd,cb){
  this.info(fd,function(err,info,src){
    if (err) {
      cb(err);
    }else{
      if (notEmpty(info) && notEmpty(info.CFBundleIcons) && notEmpty(info.CFBundleIcons.CFBundlePrimaryIcon) && notEmpty(info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles)) {

        var paths = info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles;
        console.log('paths: ',paths);

        getIconFromArray(paths, fd, function(err,src){
          if (err) {
            return cb(err);
          }else{
            return cb(null,src);
          }
        });

      }else{
        cb(new Error('No icon found.'))
      }
    }
  });
}

function getIconFromArray(paths,fd, cb){
  var path = paths.pop();
  console.log('path: ',path);
  if (!path) {
    path = 'Icon';
    getIconWithScale(path,'.png',fd,function(err,src){
      if (err) {
        cb(err);
      }else{
        return cb(null,src);
      }
    });
  }else{
    getIconWithScale(path,'@3x.png',fd,function(err,src){
      if (err) {
        getIconWithScale(path,'@2x.png',fd,function(err,src){
          if (err) {
            getIconWithScale(path,'.png',fd,function(err,src){
              if (err) {
                cb(err);
              }else{
                return cb(null,src);
              }
            });
          }else{
            return cb(null,src);
          }
        });
      }else{
        return cb(null,src);
      }
    });
  }
}

function getIconWithScale(path,scale,fd,cb){
  var path = path.concat(scale);

  var iconReg = new RegExp("^Payload\/[^\/]+\.app\/"+path+"$");
  console.log('iconReg: ',iconReg);

  payload_file(iconReg,fd,function(err, src){
    if (err) {
      cb(err);
      return;
    }else if (src) {
      cb(null, src); 
    }
  });
}

function payload_file(filename,fd,cb){
  var foundFile = false;
  cb = once(cb || function(){});
  fromFd(fd, function(err, zip){
    if (err) return cb(err);
    var onentry;

    zip.on('entry', onentry = function(entry){
      // console.log('entry: ',entry.fileName);
      if (!filename.test(entry.fileName)) {
        return
      } else {
        foundFile = true
      }

      zip.removeListener('entry', onentry);
      zip.openReadStream(entry, function(err, file){
        if (err) return cb(err);

        collect(file, function(err, src){
          if (err) return cb(err);
          cb(null, src);
        });
      });
    });

    zip
    .on('end', function() {
      if (!foundFile) { return cb(new Error('No File found')); }
    })
    .on('error', function(err) {
      return cb(err);
    });
  });
}

function notEmpty(item){
  return (typeof item !== 'undefined' && item.length !== 0);
}

module.exports = IPA;