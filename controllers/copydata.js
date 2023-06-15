const fs = require('fs');
const path = require('path');

const copydata = async (dirpath,cppath)=>{
    fs.cp(dirpath,cppath, { recursive: true }, (err) => {
        if (err) {
          console.error(err);
        }
      });
}


module.exports = copydata;