require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: process.env.ALCHEMY_GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
