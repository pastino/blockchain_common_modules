const Web3 = require("web3");
const INFURA_ENDPOINT = `http://121.168.75.64`;

const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT));

export default web3;
