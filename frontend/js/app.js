let accounts;

// METAMASK CONNECTION
window.addEventListener("load", async () => {

  const opensea = document.querySelectorAll(".opensea");
  const discord = document.querySelectorAll(".discord");
  const twitter = document.querySelectorAll(".twitter");
  const instagram = document.querySelectorAll(".instagram");

  updateSocialMediaLinks(opensea, discord, twitter, instagram);

  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    checkChain();
  } else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
  }

  if (window.web3) {
    // Check if User is already connected by retrieving the accounts
    await window.web3.eth.getAccounts().then(async (addr) => {
      accounts = addr;
    });
  }

  updateConnectStatus();
  if (MetaMaskOnboarding.isMetaMaskInstalled()) {
    window.ethereum.on("accountsChanged", (newAccounts) => {
      accounts = newAccounts;
      updateConnectStatus();
    });
  }
});

const updateSocialMediaLinks = (opensea, discord, twitter, instagram) => {
  opensea.forEach((link) => {
    link.href = socialMediaLinks.opensea;
  });
  discord.forEach((link) => {
    link.href = socialMediaLinks.discord;
  });
  twitter.forEach((link) => {
    link.href = socialMediaLinks.twitter;
  });
  instagram.forEach((link) => {
    link.href = socialMediaLinks.instagram;
  });
}

const updateConnectStatus = async () => {

  const onboarding = new MetaMaskOnboarding();
  const onboardButton = document.getElementById("connectWallet");

  if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
    onboardButton.innerText = "Install MetaMask!";
    onboardButton.onclick = () => {
      onboardButton.innerText = "Connecting...";
      onboardButton.disabled = true;
      onboarding.startOnboarding();
    };
  } else if (accounts && accounts.length > 0) {
    onboardButton.innerText = `${accounts[0].substring(0, 6)}...`;
    window.address = accounts[0];
    onboardButton.disabled = true;
    onboarding.stopOnboarding();
    window.contract = new web3.eth.Contract(abi, contractAddress);
    loadInfo();
  } else {
    onboardButton.innerText = "Connect MetaMask!";
    onboardButton.onclick = async () => {
      await window.ethereum
        .request({
          method: "eth_requestAccounts",
        })
        .then(function (accts) {
          onboardButton.innerText = `✔ ...${accts[0].slice(-4)}`;
          onboardButton.disabled = true;
          window.address = accts[0];
          accounts = accts;
          window.contract = new web3.eth.Contract(abi, contractAddress);
          loadInfo();
        });
    };
  }
};

function checkChain() {
  let chainId = 0;
  if(chain === 'rinkeby') {
    chainId = 4;
  } else if(chain === 'polygon') {
    chainId = 137;
  }
  if (window.ethereum.networkVersion !== chainId.toString()) {
    document.getElementById("my-modal").checked = true;
    document.getElementById("model-text").innerText = `Please switch metamask network to ${chain} to continue.`;
    const changeChainBtn = document.getElementById("change-chain");
    changeChainBtn.addEventListener("click", () => switchChain(chainId));
  }
}

async function switchChain(chainId) {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: web3.utils.toHex(chainId) }],
    });
    updateConnectStatus();
  } catch (err) {
      // This error code indicates that the chain has not been added to MetaMask.
    if (err.code === 4902) {
      try {
        if(chain === 'rinkeby') {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainName: 'Rinkeby Test Network',
                chainId: web3.utils.toHex(chainId),
                nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' },
                rpcUrls: ['https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
              },
            ],
          });
        } else if(chain === 'polygon') {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainName: 'Polygon Mainnet',
                chainId: web3.utils.toHex(chainId),
                nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
                rpcUrls: ['https://polygon-rpc.com/'],
              },
            ],
          });
        }
        updateConnectStatus();
      } catch (err) {
        console.log(err);
      }
    }
  }
}

async function loadInfo() {
  window.info = await window.contract.methods.getInfo().call();
  const heroBtn = document.getElementById("hero-btn");

  heroBtn.addEventListener("click", () => {
    document.getElementById("my-modal-3").checked = true;
  });

  const totalMinted = await contract.methods.totalSupply().call();
  const max_supply = info.deploymentConfig.maxSupply;
  const showMinted = document.getElementById("total-minted");
  showMinted.innerText = `${totalMinted}/${max_supply} minted`;
  document.getElementById("show").classList.remove("hidden");

  const publicMintActive = await contract.methods.mintingActive().call();
  const presaleMintActive = await contract.methods.presaleActive().call();

  const mainHeading = document.getElementById("mainHeading");
  const subHeading = document.getElementById("subHeading");
  const mainText = document.getElementById("mainText");
  const actionButton = document.getElementById("actionButton");
  const mintContainer = document.getElementById("mintContainer");
  const mintButton = document.getElementById("mintButton");

  let startTime = "";
  if (publicMintActive) {
    mainHeading.innerText = "Public Minting Open!!";
    subHeading.classList.add("hidden");
    mainText.innerText = "No whitelist needed. Public minting is now open! 🎉";
    actionButton.classList.add('hidden');
    mintButton.innerText = "Mint Your NFT";
    mintContainer.classList.remove('hidden');
    setTotalPrice();
  } else if (presaleMintActive) {
    startTime = window.info.runtimeConfig.publicMintStart;
    mainHeading.innerText = "Pre-Sale Minting Open!";
    subHeading.innerText = "Public Minting Countdown";
    
    try {
      // CHECK IF WHITELISTED
      const merkleData = await fetch(
        `/.netlify/functions/merkleProof/?wallet=${window.address}&chain=${chain}&contract=${contractAddress}`
      );
      const merkleJson = await merkleData.json();
      const whitelisted = await contract.methods.isWhitelisted(window.address, merkleJson).call();
      if(!whitelisted) {
        mainText.innerText = "You are not whitelisted for the pre-sale.. 😢";
        actionButton.innerText = "Get on the Whitelist!";
      } else {
        mainText.innerText = p_presale_mint_whitelisted;
        actionButton.classList.add('hidden');
        mintButton.innerText = button_presale_mint_whitelisted;
        mintContainer.classList.remove('hidden');
      }
    } catch(e) {
      // console.log(e);
      mainText.innerText = "You've already claimed your whitelist mint. Thank you! 🎉";
      actionButton.innerText = "Join The Community";
    }
    setTotalPrice();
  } else {
    startTime = window.info.runtimeConfig.presaleMintStart;
    mainHeading.innerText = "NFT Drop Coming Soon...";
    subHeading.innerText = "Pre-Sale Minting Countdown";
    mainText.innerText = "We are working hard to launch the NFT Collection. Stay tuned for updates!";
    actionButton.innerText = "Get on the Whitelist!";
  }

  const clockdiv = document.getElementById("countdown");
  clockdiv.setAttribute("data-date", startTime);
  countdown();


  // SHOW CARD
  // setTimeout(() => {
  //   const countdownCard = document.querySelector('.countdown');
  //   countdownCard.classList.add('show-card');
  // }, 1000);

  let priceType = '';
  if(chain === 'rinkeby') {
    priceType = 'ETH';
  } else if (chain === 'polygon') {
    priceType = 'MATIC';
  }
  const price = web3.utils.fromWei(info.deploymentConfig.mintPrice, 'ether');
  const pricePerMint = document.getElementById("pricePerMint");
  const maxPerMint = document.getElementById("maxPerMint");
  const totalSupply = document.getElementById("totalSupply");
  const mintInput = document.getElementById("mintInput");
  
  pricePerMint.innerText = `${price} ${priceType}`;
  maxPerMint.innerText = `${info.deploymentConfig.tokensPerMint}`;
  totalSupply.innerText = `${info.deploymentConfig.maxSupply}`;
  mintInput.setAttribute("max", info.deploymentConfig.tokensPerMint);

  // MINT INPUT
  const mintIncrement = document.getElementById("mintIncrement");
  const mintDecrement = document.getElementById("mintDecrement");
  const setQtyMax = document.getElementById("setQtyMax");
  const min = mintInput.attributes.min.value || false;
  const max = mintInput.attributes.max.value || false;
  mintDecrement.onclick = () => {
    let value = parseInt(mintInput.value) - 1 || 1;
    if(!min || value >= min) {
      mintInput.value = value;
      setTotalPrice()
    }
  };
  mintIncrement.onclick = () => {
    let value = parseInt(mintInput.value) + 1 || 1;
    if(!max || value <= max) {
      mintInput.value = value;
      setTotalPrice()
    }
  };
  setQtyMax.onclick = () => {
    mintInput.value = max;
    setTotalPrice()
  };
  mintInput.onchange = () => {
    setTotalPrice()
  };
  mintInput.onkeyup = async (e) => {
    if (e.keyCode === 13) {
      mint();
    }
  };
  mintButton.onclick = mint;
}

function setTotalPrice() {
  const mintInput = document.getElementById("mintInput");
  const mintInputValue = parseInt(mintInput.value);
  const totalPrice = document.getElementById("totalPrice");
  const mintButton = document.getElementById("mintButton");
  if(mintInputValue < 1 || mintInputValue > info.deploymentConfig.tokensPerMint) {
    totalPrice.innerText = 'INVALID QUANTITY';
    mintButton.disabled = true;
    mintInput.disabled = true;
    return;
  }
  const totalPriceWei = BigInt(info.deploymentConfig.mintPrice) * BigInt(mintInputValue);
  
  let priceType = '';
  if(chain === 'rinkeby') {
    priceType = 'ETH';
  } else if (chain === 'polygon') {
    priceType = 'MATIC';
  }
  const price = web3.utils.fromWei(totalPriceWei.toString(), 'ether');
  totalPrice.innerText = `${price} ${priceType}`;
  mintButton.disabled = false;
  mintInput.disabled = false;
}

async function mint() {
  const mintButton = document.getElementById("mintButton");
  mintButton.disabled = true;
  mintButton.classList.add("loading");

  const amount = parseInt(document.getElementById("mintInput").value);
  const value = BigInt(info.deploymentConfig.mintPrice) * BigInt(amount);
  const publicMintActive = await contract.methods.mintingActive().call();
  const presaleMintActive = await contract.methods.presaleActive().call();

  const mintModle = document.getElementById("my-modal-3");
  const mintedModle = document.getElementById("my-modal-6");

  if (publicMintActive) {
    // PUBLIC MINT
    try {
      const mintTransaction = await contract.methods
        .mint(amount)
        .send({ from: window.address, value: value.toString() });
      if(mintTransaction) {
        if(chain === 'rinkeby') {
          const url = `https://rinkeby.etherscan.io/tx/${mintTransaction.transactionHash}`;
          // const mintedContainer = document.querySelector('.minted-container');
          // const countdownContainer = document.querySelector('.countdown');
          mintModle.checked = false;
          mintedModle.checked = true;
          const mintedTxnBtn = document.getElementById("mintedTxnBtn");
          mintedTxnBtn.href = url;
          // countdownContainer.classList.add('hidden');
          // mintedContainer.classList.remove('hidden');
        }
        console.log("Minuted successfully!", `Transaction Hash: ${mintTransaction.transactionHash}`);
      } else {
        const mainText = document.getElementById("mainText");
        mainText.innerText = "Minting failed. 😢 Please try again.";
        mintButton.innerText = "Mint Your NFT";
        mintButton.classList.remove("loading");
        mintButton.disabled = false;

        console.log("Failed to mint!");
      }
    } catch(e) {
      const mainText = document.getElementById("mainText");
      mainText.innerText = "Minting failed. 😢 Please try again.";
      mintButton.innerText = "Mint Your NFT";
      mintButton.classList.remove("loading");
      mintButton.disabled = false;

      console.log(e);
    }
  } else if (presaleMintActive) {
    // PRE-SALE MINTING
    try {
      const merkleData = await fetch(
        `/.netlify/functions/merkleProof/?wallet=${window.address}&chain=${chain}&contract=${contractAddress}`
      );
      const merkleJson = await merkleData.json();
      const presaleMintTransaction = await contract.methods
        .presaleMint(amount, merkleJson)
        .send({ from: window.address, value: value.toString() });
      if(presaleMintTransaction) {
        if(chain === 'rinkeby') {
          const url = `https://rinkeby.etherscan.io/tx/${presaleMintTransaction.transactionHash}`;
          const mintedContainer = document.querySelector('.minted-container');
          // const countdownContainer = document.querySelector('.countdown');
          // const mintedTxnBtn = document.getElementById("mintedTxnBtn");
          mintedTxnBtn.href = url;
          mintModle.checked = false;
          mintedModle.checked = true;
          // countdownContainer.classList.add('hidden');
          // mintedContainer.classList.remove('hidden');
        }
        console.log("Minuted successfully!", `Transaction Hash: ${presaleMintTransaction.transactionHash}`);
      } else {
        const mainText = document.getElementById("mainText");
        mainText.innerText = "Minting failed. 😢 Please try again.";
        mintButton.innerText = "Mint Your Special NFT";
        mintButton.classList.remove("loading");
        mintButton.disabled = false;

        console.log("Failed to mint!");
      }
    } catch(e) {
      const mainText = document.getElementById("mainText");
      mainText.innerText = "Minting failed. 😢 Please try again.";
      mintButton.innerText = "Mint Your Special NFT";
      mintButton.classList.remove("loading");
      mintButton.disabled = false;

      // console.log(e);
    }
  }
}
