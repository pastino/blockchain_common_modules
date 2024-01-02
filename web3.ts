const Web3 = require("web3");

const ETH_NODE_HTTP = process.env.ETH_NODE_HTTP;
const ETH_NODE_WS = process.env.ETH_NODE_WS;

console.log("ETH_NODE_WS", ETH_NODE_WS);

const web3 = new Web3(new Web3.providers.HttpProvider(ETH_NODE_HTTP));
const web_socket3 = new Web3(new Web3.providers.WebsocketProvider(ETH_NODE_WS));

export { web3, web_socket3 };
