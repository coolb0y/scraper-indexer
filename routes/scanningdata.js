const router = require('express').Router();


router.get('/', (req, res) => {
        // Set the appropriate headers for server-sent events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
      
        // Send a "heartbeat" event every 5 seconds
 
      
        // Send a sample event every second
        const dataInterval = setInterval(() => {
            let filescount = scandataval.nofiles;
            let folderscount = scandataval.nofolders;
          res.write(`data: ${JSON.stringify({filescount,folderscount})}\n\n`);
        }, 200);
      
        // Close the server-sent event connection on client request
        req.on('close', () => {
        
          clearInterval(dataInterval);
          res.end();
        });
      });

module.exports = router;