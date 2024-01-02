import { Alchemy, Network } from "alchemy-sdk";
import { getRepository } from "typeorm";
import { BlockNumber } from "./entities/BlockNumber";
import { Message } from "./modules/kakao";
import { Transaction } from "./modules/transaction";
import { LogError } from "./entities/LogError";
import { web3 } from "./web3";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

export const alchemy = new Alchemy(config);
const kakaoMessage = new Message();

export async function handleBlockEvent(blockNum: number) {
  try {
    console.log("블록 데이터 생성 시작", blockNum);

    const startExistingBlock = new Date().getTime();
    const existingBlock = await getRepository(BlockNumber).findOne({
      where: {
        blockNumber: blockNum,
      },
    });
    const endExistingBlock = new Date().getTime();
    console.log(
      "ExistingBlock",
      (endExistingBlock - startExistingBlock) / 1000
    );

    if (existingBlock) {
      console.log("이미 처리된 블록", blockNum);
      return { isSuccess: false, message: "이미 처리된 블록" };
    }

    const startBlockData = new Date().getTime();

    const blockData = await web3.eth.getBlock(blockNum);
    const endBlockData = new Date().getTime();
    console.log("BlockData", (endBlockData - startBlockData) / 1000);

    const startCreateBolck = new Date().getTime();

    const blockNumber = await getRepository(BlockNumber).save({
      blockNumber: blockNum,
    });
    const endCreateBolck = new Date().getTime();
    console.log("CreateBolck", (endCreateBolck - startCreateBolck) / 1000);
    const transaction = new Transaction({
      blockData,
      blockNumber,
    });

    await transaction.progressTransaction();

    await getRepository(BlockNumber).update(
      { id: blockNumber.id },
      { isCompletedUpdate: true }
    );

    const logErrorList = await getRepository(LogError).find({
      where: {
        blockNumber: blockNum,
      },
    });

    if (logErrorList.length > 0) {
      for (let i = 0; i < logErrorList.length; i++) {
        const logError = logErrorList[i];
        await getRepository(LogError).delete({ id: logError.id });
      }
    }
    console.log("블록 데이터 생성 완료", blockNum);
    return { isSuccess: true, message: `블록 데이터 생성 완료 - ${blockNum}` };
  } catch (e: any) {
    // await kakaoMessage.sendMessage(
    //   `${moment(new Date()).format(
    //     "MM/DD HH:mm"
    //   )}\n\n블록 데이터 생성 실패 ${blockNum}\n\n${e.message}`
    // );

    await getRepository(BlockNumber).delete({ blockNumber: blockNum });
    await getRepository(LogError).save({
      blockNumber: blockNum,
      errorMessage: e.message,
    });
    console.log(e);

    throw new Error(e);
  }
}
