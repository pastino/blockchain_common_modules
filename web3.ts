import "../env";
const Web3 = require("web3");
const INFURA_ENDPOINT = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;
//  "http://121.168.75.64/block/eth";

const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT));

export default web3;
