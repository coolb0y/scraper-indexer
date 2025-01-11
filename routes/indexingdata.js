const router = require('express').Router();


router.get('/', (req, res) => {
    // Set the appropriate headers for server-sent events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log('indexdata count val',indexdataval)
    // Send a sample event every second
    const dataInterval = setInterval(() => {

        if (indexdataval > 0) {
            res.write(`data: ${JSON.stringify({ indexdataval })}\n\n`);
        }
    }, 50);

    // Close the server-sent event connection on client request
    req.on('close', () => {
        indexdataval = 0;
        clearInterval(dataInterval);
        res.end();
    });
});

module.exports = router;