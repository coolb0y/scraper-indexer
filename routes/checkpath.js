const router = require('express').Router();
const fs = require('fs');

router.get('/',(req,res)=>{

    const path = req.query.path;
    // check if folder exists
    if(fs.existsSync(path)){
        return res.status(200).json({
            message: 'true'
        })
    }
    else{
        return res.status(200).json({
            message: 'false'
        })
    }
  

})

module.exports = router;