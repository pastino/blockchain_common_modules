import { Log } from "alchemy-sdk";
import * as _ from "lodash";
import { getRepository } from "typeorm";
import Web3 from "web3";
import { Signature as SignatureEntity } from "../entities/Signature";

const web3 = new Web3();

export class Signature {
  constructor() {}

  generateABI(textSignature: string) {
    const inputTypes = textSignature
      .slice(textSignature.indexOf("(") + 1, textSignature.indexOf(")"))
      .split(",");

    const name = textSignature.slice(0, textSignature.indexOf("("));

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

  async getABI(hexSignature: string) {
    // console.log("hexSignature", hexSignature);
    const signatureData: SignatureEntity | undefined = await getRepository(
      SignatureEntity
    ).findOne({
      where: {
        hexSignature,
      },
    });

    if (!signatureData) {
      //   console.log("Signature not found");
      return;
    }

    return this.generateABI(signatureData.textSignature);
  }

  async logAnalyzer(log: Log, block?: any) {
    const abi = await this.getABI(log.topics?.[0]);

    if (!abi) return;
    const decodedLog = web3.eth.abi.decodeLog(
      abi.inputs,
      log.data,
      log.topics.slice(1)
    );

    console.log("decodedLog", decodedLog);
  }
}
