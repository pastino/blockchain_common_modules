import { Alchemy, Network } from "alchemy-sdk";
import { getRepository } from "typeorm";
import { BlockNumber } from "./entities/BlockNumber";
import { Message } from "./modules/kakao";
import { Transaction } from "./modules/transaction";
import moment from "moment";
import { LogError } from "./entities/LogError";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
export const alchemy = new Alchemy(config);
const kakaoMessage = new Message();

export async function handleBlockEvent(blockNum: number) {
  try {
    console.log("블록 데이터 생성 시작", blockNum);
    const existingBlock = await getRepository(BlockNumber).findOne({
      where: {
        blockNumber: blockNum,
      },
    });

    if (existingBlock) return { isSuccess: false, message: "이미 처리된 블록" };
    const blockData = await alchemy.core.getBlock(blockNum);
    const blockNumber = await getRepository(BlockNumber).save({
      blockNumber: blockNum,
    });

    const transaction = new Transaction({
      transactionHash: "",
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
    await kakaoMessage.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n블록 데이터 생성 실패 ${blockNum}\n\n${e.message}`
    );

    await getRepository(BlockNumber).delete({ blockNumber: blockNum });
    await getRepository(LogError).save({
      blockNumber: blockNum,
    });
    console.log(e);

    throw new Error(e);
  }
}
