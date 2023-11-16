const Web3 = require("web3");
const ETH_NODE_HTTP = `http://121.168.75.64/block/`;
const ETH_NODE_WS = `ws://121.168.75.64/eth-ws/`;

const web3 = new Web3(new Web3.providers.HttpProvider(ETH_NODE_HTTP));
const web_socket3 = new Web3(new Web3.providers.WebsocketProvider(ETH_NODE_WS));

export { web3, web_socket3 };
