const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');
const Blockchain = require('./blockchain/blockchain');
const uuid = require('uuid');

const app = express();
const port = process.argv[2];

const { validateOrder } = require("./blockchain/validator");

const fishFeedChain = new Blockchain();
fishFeedChain.networkNodes = [];
fishFeedChain.currentNodeUrl = `http://localhost:${port}`;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



app.get('/blockchain', function (req, res) {
    res.send(fishFeedChain);
});



app.post('/transaction', function (req, res) {
    const blockIndex =
        fishFeedChain.addTransactionToPendingTransactions(req.body);
    res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});


app.post("/transaction/broadcast", async (req, res) => {
  try {
    const {
      order_id,
      distributor,
      farmer,
      quantity,
      price,
      feed_type,
      exp_date,
    //   order_status,
      delivery_location,
      product_name,
      quantity_available
    } = req.body;

    
    const validation = validateOrder({ quantity, price, feed_type,quantity_available,exp_date,delivery_location });

    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.message
      });
    }


    const newTransaction = fishFeedChain.createNewTransaction(
      order_id,
      distributor,
      farmer,
      quantity,
      price,
      feed_type,
      exp_date,
    //   order_status,
      delivery_location,
      product_name,
      quantity_available
    );

    fishFeedChain.addTransactionToPendingTransactions(newTransaction);

    
    const requestPromises = [];
    fishFeedChain.networkNodes.forEach(networkNodeUrl => {
      requestPromises.push(
        rp({
          uri: networkNodeUrl + "/transaction",
          method: "POST",
          body: newTransaction,
          json: true
        })
      );
    });

    await Promise.all(requestPromises);

    res.json({ note: "Order transaction validated & broadcast successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Validation failed" });
  }
});



app.get('/mine', function (req, res) {
    const lastBlock = fishFeedChain.getLastBlock();
    const previousBlockHash = lastBlock.hash;

    const currentBlockData = {
        transactions: fishFeedChain.pendingTransactions,
        index: lastBlock.index + 1
    };

    const nonce = fishFeedChain.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = fishFeedChain.hashBlock(
        previousBlockHash,
        currentBlockData,
        nonce
    );

    const newBlock = fishFeedChain.createNewBlock(
        nonce,
        previousBlockHash,
        blockHash
    );

    const requestPromises = [];
    fishFeedChain.networkNodes.forEach(networkNodeUrl => {
        requestPromises.push(
            rp({
                uri: networkNodeUrl + '/receive-new-block',
                method: 'POST',
                body: { newBlock: newBlock },
                json: true
            })
        );
    });

    Promise.all(requestPromises).then(() => {
        res.json({
            note: 'New fish feed block mined & broadcast',
            block: newBlock
        });
    });
});

app.post('/receive-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = fishFeedChain.getLastBlock();

    const correctHash =
        lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex =
        lastBlock.index + 1 === newBlock.index;

    if (correctHash && correctIndex) {
        fishFeedChain.chain.push(newBlock);
        fishFeedChain.pendingTransactions = [];
        res.json({ note: 'New block accepted.' });
    } else {
        res.json({ note: 'New block rejected.' });
    }
});


app.get('/verify-order/:orderId', function (req, res) {
    const orderId = req.params.orderId;

    let foundTransaction = null;
    let foundBlock = null;

    fishFeedChain.chain.forEach(block => {
        block.transactions.forEach(tx => {
            if (tx.order_id == orderId) {
                foundTransaction = tx;
                foundBlock = block;
            }
        });
    });

    if (!foundTransaction) {
        return res.json({
            found: false,
            message: 'Order not found on blockchain.'
        });
    }

    res.json({
        found: true,
        transaction: foundTransaction,
        block: {
            index: foundBlock.index,
            hash: foundBlock.hash,
            previousBlockHash: foundBlock.previousBlockHash,
            timestamp: foundBlock.timestamp,
            nonce: foundBlock.nonce
        }
    });
});



app.get('/block/:blockHash', (req, res) => {
    res.json({ block: fishFeedChain.getBlock(req.params.blockHash) });
});

app.get('/transaction/:transactionId', (req, res) => {
    res.json(fishFeedChain.getTransaction(req.params.transactionId));
});

app.get('/address/:name', (req, res) => {
    res.json({ addressData: fishFeedChain.getAddressData(req.params.name) });
});

app.listen(port, function () {
    console.log(`🐟 Fish Feed Node running on port ${port}`);
});

console.log(fishFeedChain);
