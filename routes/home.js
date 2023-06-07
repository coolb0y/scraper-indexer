const router = require('express').Router();


router.get('/', (req, res) => {
    return res.status(200).sendFile('index.html', { root: __dirname + "/../views/" });
})

module.exports = router;