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
    const existingBlock = await getRepository(BlockNumber).findOne({
      where: {
        blockNumber: blockNum,
      },
    });

    if (existingBlock) return;

    const blockData = await alchemy.core.getBlock(blockNum);
    const blockNumber = await getRepository(BlockNumber).save({
      blockNumber: blockNum,
    });
    const transactions = blockData?.transactions;

    for (let i = 0; i < transactions.length; i++) {
      const transactionHash = transactions[i];

      const transaction = new Transaction({
        transactionHash,
        blockData,
        blockNumber,
      });
      await transaction.progressTransaction();
    }
    await getRepository(BlockNumber).update(
      { id: blockNumber.id },
      { isCompletedUpdate: true }
    );
    console.log("블록 데이터 생성 완료", blockNum);
  } catch (e: any) {
    await kakaoMessage.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n블록 데이터 생성 실패 ${blockNum}\n\n${e.message}`
    );
    await getRepository(LogError).save({
      blockNumber: blockNum,
    });
    await getRepository(BlockNumber).delete({ blockNumber: blockNum });
    console.log(e);
  }
}
