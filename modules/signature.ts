import { Log } from "alchemy-sdk";
import * as _ from "lodash";
import { getConnection } from "typeorm";
import Web3 from "web3";

const web3 = new Web3();

export class Signature {
  private snakeObject = {};
  private entity = {};

  constructor({ snakeObject }: { snakeObject: {} }) {
    this.snakeObject = snakeObject;
  }

  generateABI(signature: string) {
    const inputTypes = signature
      .slice(signature.indexOf("(") + 1, signature.indexOf(")"))
      .split(",");

    const name = signature.slice(0, signature.indexOf("("));

    const abi = {
      name: name,
      type: "event",
      inputs: inputTypes.map((inputType, index) => ({
        type: inputType.trim(),
        name: `param${index}`,
      })),
    };

    return abi;
  }

  checksignatue() {}

  logAnalyzer(log: Log) {
    //   log.topics?.[0]

    const nftTransferEventAbi: any = {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    };

    const nftTransferEventSignature =
      web3.eth.abi.encodeEventSignature(nftTransferEventAbi);

    //   let decodedLog;
    //   if (log.topics[0] === nftTransferEventSignature) {
    //     try {
    //       decodedLog = web3.eth.abi.decodeLog(
    //         nftTransferEventAbi.inputs,
    //         log.data,
    //         log.topics.slice(1)
    //       );
    //     } catch (e) {
    //       null;
    //     }
    //   } else if (log.topics[0] === nftTransferEventSignature1) {
    //     console.log("erc20");
    //     try {
    //       decodedLog = web3.eth.abi.decodeLog(
    //         nftTransferEventAbi1.inputs,
    //         log.data,
    //         log.topics.slice(1)
    //       );
    //     } catch (e) {
    //       null;
    //     }
    //   } else {
    //     return;
    //   }
    //   if (decodedLog?.tokenId === undefined) return;
  }
}
