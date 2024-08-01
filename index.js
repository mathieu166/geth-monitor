const express = require('express');
const {Web3} = require('web3');

const app = express();
const port = 3001;

// Define the endpoint to check Geth status
app.get('/check-geth', async (req, res) => {
  try {
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
    res.status(500).send(`Error connecting to Geth: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
