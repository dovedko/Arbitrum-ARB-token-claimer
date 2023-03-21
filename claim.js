const fs = require('fs');
const Web3 = require('web3');
const { Mutex } = require('async-mutex');
const bip39 = require('bip39');
const hdkey = require('hdkey');

const configFile = JSON.parse(fs.readFileSync('config.json'));
const keysAndSeedPhrasesFile = fs.readFileSync('keys.txt', 'utf-8');

const {
  tokenDistributorABI,
  tokenDistributorAddress,
  networkURL,
  gasPrice,
  gasLimit,
  l2NetworkURL
} = configFile;

const keysAndSeedPhrases = keysAndSeedPhrasesFile.split('\n').filter((line) => line.trim());
const l1Web3 = new Web3(networkURL);
const l2Web3 = new Web3(new Web3.providers.HttpProvider(l2NetworkURL));

let successfulClaims = [];
const successfulClaimsMutex = new Mutex();

function secondsToHMS(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).toString().padStart(2, '0')}`;
}

function derivePrivateKey(seedPhrase, index) {
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  const hdWallet = hdkey.fromMasterSeed(seed);
  const walletPath = "m/44'/60'/0'/0/" + index;
  const wallet = hdWallet.derive(walletPath);
  return wallet.privateKey.toString('hex');
}

async function claimTokens(key, walletNumber) {
  const privateKey = key.startsWith('0x') ? key : '0x' + key;
  const wallet = l2Web3.eth.accounts.privateKeyToAccount(privateKey);
  const contract = new l2Web3.eth.Contract(tokenDistributorABI, tokenDistributorAddress, {
    from: wallet.address,
  });

  const gasPriceWei = l2Web3.utils.toWei(gasPrice, 'gwei');
  const nonce = await l2Web3.eth.getTransactionCount(wallet.address);

  const tx = {
    to: tokenDistributorAddress,
    gas: gasLimit,
    gasPrice: gasPriceWei,
    nonce: nonce,
    data: contract.methods.claim().encodeABI(),
  };

  const signedTx = await wallet.signTransaction(tx);
  console.log(`Worker ${walletNumber}: Claiming tokens for wallet ${wallet.address}`);

  try {
    const receipt = await l2Web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    await successfulClaimsMutex.runExclusive(async () => {
      successfulClaims.push({ wallet: wallet.address, txHash: receipt.transactionHash });
    });
    console.log(`Worker ${walletNumber}: Successfully claimed tokens for wallet ${wallet.address}. TxHash: ${receipt.transactionHash}`);
  } catch (error) {
    console.error(`Worker ${walletNumber}: Error claiming tokens for wallet ${wallet.address}:`, error.message);
  }
}

async function estimateTimeToBlock(targetBlockNumber, web3) {
    const currentBlockNumber = await web3.eth.getBlockNumber();
    const blocksToGo = targetBlockNumber - currentBlockNumber;
    if (blocksToGo <= 0) {
      return 0;
    }
  
    const recentBlock = await web3.eth.getBlock(currentBlockNumber);
    const recentBlockTimestamp = recentBlock.timestamp;
  
    const pastBlock = await web3.eth.getBlock(currentBlockNumber - 9); // Using 10 blocks to calculate the average block time
    const pastBlockTimestamp = pastBlock.timestamp;
  
    const averageBlockTime = (recentBlockTimestamp - pastBlockTimestamp) / 10;
    const estimatedTime = blocksToGo * averageBlockTime;
  
    return estimatedTime;
  }
  
  async function waitForBlock(targetBlockNumber, web3) {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    while (currentBlockNumber < targetBlockNumber) {
      const estimatedTime = await estimateTimeToBlock(targetBlockNumber, web3);
      console.log(
        `Current block: ${currentBlockNumber}, waiting for block ${targetBlockNumber}. Estimated time remaining: ${secondsToHMS(
          Math.round(estimatedTime)
        )}`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Check every 1 second
      currentBlockNumber = await web3.eth.getBlockNumber();
    }
  }
  
  async function main() {
    const workers = [];
    for (let i = 0; i < keysAndSeedPhrases.length; i++) {
      const keyOrSeedPhrase = keysAndSeedPhrases[i].trim();
      if (keyOrSeedPhrase) {
        const privateKey = bip39.validateMnemonic(keyOrSeedPhrase) ? derivePrivateKey(keyOrSeedPhrase, 0) : keyOrSeedPhrase;
        const worker = claimTokens(privateKey, i + 1);
        workers.push(worker);
      }
    }
  
    await Promise.all(workers);
  
    console.log('\nClaims summary:');
    console.log(`Total successful claims: ${successfulClaims.length}`);
    successfulClaims.forEach((claim, index) => {
      console.log(`#${index + 1}: Wallet ${claim.wallet} - TxHash: ${claim.txHash}`);
    });
  }
  
  const targetBlockNumber = 16890400; // Replace with the desired Ethereum L1 block number to wait for
  
  waitForBlock(targetBlockNumber, l1Web3)
    .then(main)
    .catch((error) => {
      console.error('Error:', error);
    });
  
  
