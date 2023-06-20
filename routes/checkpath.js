const router = require('express').Router();
const fs = require('fs');

router.get('/',(req,res)=>{

    const path = req.query.dirPath;
    // check if folder exists
    if(fs.existsSync(path)){
        return res.status(200).json({
            ans: 'true'
        })
    }
    else{
        return res.status(200).json({
            ans: 'false'
        })
    }
  

})

module.exports = router;