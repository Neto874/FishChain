const sha256 = require('sha256');
const uuid = require('uuid');

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.createNewBlock(100, '0', '0');
    }
    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
        };

        this.pendingTransactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    createNewTransaction(orderId,
        distributor,
        farmer,
        quantity,
        price,
        feed_type,
        exp_date,
        // order_status,
        delivery_location,
        product_name) {
        const newTransaction = {
            order_id: orderId,
            distributor,
            farmer,
            quantity,
            price,
            feed_type,
            exp_date,
            // order_status,
            delivery_location,
            product_name,

            timestamp: Date.now(),
            transactionId: uuid.v1().split('-').join('')
        };

        return newTransaction;
    }
    addTransactionToPendingTransactions(transactionObj) {
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1;
    }
    hashBlock(previousBlockHash, currentBlockData, nonce) {
        const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        return sha256(dataAsString);
    }
    proofOfWork(previousBlockHash, currentBlockData) {
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while (hash.substring(0, 4) !== '0000') {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }
        return nonce;
    }
    getBlock(blockHash) {
        let correctBlock = null;
        this.chain.forEach(block => {
            if (block.hash === blockHash) correctBlock = block;
        });
        return correctBlock;
    }
    getTransaction(transactionId) {
        let correctTransaction = null;
        let correctBlock = null;

        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.transactionId === transactionId) {
                    correctTransaction = transaction;
                    correctBlock = block;
                }
            });
        });

        return {
            transaction: correctTransaction,
            block: correctBlock
        };
    }

    getAddressData(name) {
        const addressTransactions = [];

        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.distributor === name ||
                    transaction.farmer === name) {
                    addressTransactions.push(transaction);
                }
            });
        });

        return {
            addressTransactions: addressTransactions,
            transactionCount: addressTransactions.length
        };
    }
}


module.exports = Blockchain;
