const express = require('express');
const { Web3 } = require('web3');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3001;

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
    if (dbPath && minerAddress) {
      // Check the database for the last timestamp
      const lastTimestamp = await getLastTimestamp(dbPath, minerAddress);
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      
      console.log(lastTimestamp, oneHourAgo)
      if (lastTimestamp && lastTimestamp < oneHourAgo) {
        res.status(500).send('Geth not validating anymore');
        return;
      }
    }

    // Create a new Web3 instance for each request
    const web3 = new Web3('http://localhost:8545');

    // Custom RPC call to get the number of peers
    const peers = await web3.eth.net.getPeerCount();

    // Check some condition (e.g., there should be at least one peer)
    if (peers > 0) {
      res.status(200).send(`Geth is running. Number of peers: ${peers}`);
    } else {
      res.status(500).send('Geth is not connected to any peers.');
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
