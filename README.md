# Arbitrum-ARB-token-claimer
Node.js script that claims tokens from a smart contract on the Arbitrum L2 network using multiple private keys and seed phrases stored in a keys.txt file. It uses the Web3 library to interact with the Arbitrum network and the async-mutex library to prevent concurrent writes to a shared successfulClaims array.

When the script is run, it first reads the config.json file to get the necessary configuration parameters like the ABI and address of the token distributor contract, the network URL, gas price, and gas limit. It then reads the keys.txt file to get the private keys and seed phrases for the wallets to use for claiming tokens.

The script then defines several helper functions for converting seconds to a human-readable format, deriving a private key from a seed phrase, estimating the time to a specific block on the Ethereum L1 network, waiting for a specific block on the Ethereum L1 network, and claiming tokens from the token distributor contract.

Next, the script defines the main main() function which creates a worker for each private key/seed phrase in the keys.txt file, and executes each worker in parallel using Promise.all(). Each worker claims tokens from the token distributor contract using the private key and sends the transaction to the Ethereum L1 network.

After all the workers have completed, the main() function prints a summary of the successful token claims to the console.

# To run the claim.js script, you can follow these steps:

1. Install Node.js on your system if you haven't already done so.
2. Clone the GitHub repository containing the claim.js script to your local machine.
4. Run the command npm install in terminal to install the required dependencies.
5. Change L1 ETH and L2 Arbitrum RPC to yours private RPCs in config.json file.
6. Add you private keys and seed phrases to keys.txt file for the wallets you want to use for claiming tokens, one per line.
7. Run the command node claim.js to start the script.

When you run the claim.js script, it will first wait for a specific block on the Ethereum L1 network (specified in the targetBlockNumber variable) before starting the token claiming process. Once the target block has been reached, the script will start claiming tokens using the private keys/seed phrases in the keys.txt file. The script will print status updates and a summary of the successful token claims to the console as it runs.
