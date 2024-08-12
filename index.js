const express = require('express');
const { Web3 } = require('web3');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3001;

require('dotenv').config();

// Load environment variables
const dbPath = process.env.GETH_STATS_DB_PATH;
const minerAddress = process.env.MINER_ADDRESS;

// Function to get the last timestamp for a given miner address
const getLastTimestamp = (dbPath, minerAddress) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        return reject(err);
      }
    });

    const query = `SELECT timestamp FROM block WHERE lower(miner_address) = lower(?) ORDER BY timestamp DESC LIMIT 1`;

    db.get(query, [minerAddress], (err, row) => {
      db.close();
      if (err) {
        return reject(err);
      }
      if (row) {
        resolve(row.timestamp);
      } else {
        resolve(null);
      }
    });
  });
};

// Define the endpoint to check Geth status
app.get('/check-geth', async (req, res) => {
  try {
    let responseText = '';
    if (dbPath && minerAddress) {
      // Check the database for the last timestamp
      const lastTimestamp = await getLastTimestamp(dbPath, minerAddress);
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;

      if (lastTimestamp) {
        const timeSinceLastBlock = Math.floor(Date.now() / 1000) - lastTimestamp;
        const timeSinceLastBlockFormatted = new Date(timeSinceLastBlock * 1000).toISOString().substr(11, 8); // HH:MM:SS

        if (lastTimestamp < oneHourAgo) {
          responseText = `Geth not validating anymore. Last block was ${timeSinceLastBlockFormatted} ago.`;
          res.status(500).send(responseText);
          return;
        }

        responseText = `Last block was ${timeSinceLastBlockFormatted} ago. `;
      }
    }

    // Create a new Web3 instance for each request
    const web3 = new Web3('http://localhost:8545');

    // Custom RPC call to get the number of peers
    const peers = await web3.eth.net.getPeerCount();

    // Check some condition (e.g., there should be at least one peer)
    if (peers > 0) {
      res.status(200).send(responseText + `Geth is running. Number of peers: ${peers}`);
    } else {
      res.status(500).send(responseText + 'Geth is not connected to any peers.');
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
