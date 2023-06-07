const router = require('express').Router();
const path = require('path');

router.get('/', (req, res) => {
    path.join(__dirname, '../views/index.html');
    return res.status(200).sendFile('index.html', { root: __dirname + "/../views/" });
})

module.exports = router;