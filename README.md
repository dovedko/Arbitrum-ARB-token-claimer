# Arbitrum-ARB-token-claimer
This code is a Node.js script designed to claim tokens from a token distributor contract on Ethereum Layer 2 network (Arbitrum). The script takes a list of Ethereum seed phrases or private keys as input, derives one or more private keys from each seed phrase, and then claims the tokens from the contract. The script waits for a specific Ethereum Layer 1 block number before starting the token claiming process on Arbitrum L2.

# To run the claim.js script, you can follow these steps:

1. Install Node.js on your system if you haven't already done so.
2. Clone the GitHub repository containing the claim.js script to your local machine.
4. Run the command npm install in terminal to install the required dependencies 

Or use this commands to in install all libraries: "npm install web3"; "npm install async-mutex"; "npm install hdkey"; "npm install bip39"

5. Change L1 ETH and L2 Arbitrum RPC to yours private RPCs in config.json file.
6. Add you private keys and seed phrases to keys.txt file for the wallets you want to use for claiming tokens, one per line.
7. Change numKeysPerSeed in claim.js if you want extract more than one private key from each seed phrase, defalt settings is 1.
7. Type in terminal command node claim.js or npm start to run the script.
