const Web3 = require("web3");
const INFURA_ENDPOINT = `http://121.168.75.64`;
const INFURA_ENDPOINTt = `ws://121.168.75.64/eth/ws`;

const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT));
const web_socket3 = new Web3(
  new Web3.providers.WebsocketProvider(INFURA_ENDPOINTt)
);

export { web3, web_socket3 };
