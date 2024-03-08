const Web3 = require("web3");

const ETH_NODE_HTTP = `${process.env.AWS_ETH_NODE_HTTP}/?billingtoken=${process.env.AWS_ETH_NODE_TOKEN}`;
const ETH_NODE_WS = `${process.env.ETH_NODE_WS}/?billingtoken=${process.env.AWS_ETH_NODE_TOKEN}`;

const web3 = new Web3(new Web3.providers.HttpProvider(ETH_NODE_HTTP));
const web_socket3 = new Web3(new Web3.providers.WebsocketProvider(ETH_NODE_WS));

export { web3, web_socket3 };
