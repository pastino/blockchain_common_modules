import { getConnection, getRepository, QueryRunner } from "typeorm";
import { OpenseaCollection } from "../entities/OpenseaCollection";
import { Message } from "./kakao";
import { CreateEntityData } from "./manufactureData";
import { Contract as ContractEntity } from "../entities/Contract";
import axios, { AxiosResponse } from "axios";
import { alchemy } from "../blockEventHandler";
import moment from "moment";
import { sleep } from "../utils";

const openSeaConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

const kakaoMessage = new Message();

export class Contract {
  private address = "";
  private queryRunner: QueryRunner;

  constructor({ address }: { address: string }) {
    this.address = address;
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    this.queryRunner = queryRunner;
  }

  async handleOpenseaContract(
    contractAddress: string,
    retryCount: number = 10
  ): Promise<AxiosResponse | undefined> {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/asset_contract/${contractAddress}`,
        openSeaConfig
      );

      return response;
    } catch (e: any) {
      if (e.response && e.response.status !== 404) {
        if (retryCount > 0) {
          await sleep(3);
          return this.handleOpenseaContract(contractAddress, retryCount - 1);
        } else {
          await kakaoMessage.sendMessage(
            `${moment(new Date()).format(
              "MM/DD HH:mm"
            )}\n\nopensea error - handleOpenseaContract`
          );
          throw new Error(e);
        }
      }
    }
  }

  async saveContract(): Promise<ContractEntity> {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    try {
      let contract = await this.queryRunner.manager.findOne(ContractEntity, {
        where: {
          address: this.address,
        },
      });

      // let contract = await getRepository(ContractEntity).findOne({
      //   where: {
      //     address: this.address,
      //   },
      // });

      if (!contract) {
        const contractMetaData = await alchemy.nft.getContractMetadata(
          this.address
        );

        const newContract = {
          ...contractMetaData,
          ...contractMetaData.openSea,
          name:
            contractMetaData.name || contractMetaData.openSea?.collectionName,
        };
        delete contractMetaData.openSea;

        try {
          contract = await this.queryRunner.manager.save(
            ContractEntity,
            newContract
          );

          // contract = await getRepository(ContractEntity).save(newContract);

          const openseaData = await this.handleOpenseaContract(
            contract.address
          );
          const createEntityData = new CreateEntityData({
            snakeObject: openseaData?.data?.collection,
            entity: OpenseaCollection,
            filterList: ["id"],
          });

          const openseaCollection = await this.queryRunner.manager.save(
            OpenseaCollection,
            {
              ...createEntityData.createTableRowData(),
              contract,
            }
          );

          // const openseaCollection = await getRepository(OpenseaCollection).save({
          //   ...createEntityData.createTableRowData(),
          //   contract,
          // });

          await this.queryRunner.manager.update(
            ContractEntity,
            {
              id: contract.id,
            },
            {
              openseaCollection,
            }
          );

          // await getRepository(ContractEntity).update(
          //   {
          //     id: contract.id,
          //   },
          //   {
          //     openseaCollection,
          //   }
          // );
        } catch (e: any) {
          if (e.code === "23505") {
            contract = await getRepository(ContractEntity).findOne({
              where: {
                address: this.address,
              },
            });

            // contract = await getRepository(ContractEntity).findOne({
            //   where: {
            //     address: this.address,
            //   },
            // });
          }
        }
      }
      if (!contract) {
        throw new Error(
          `Failed to find or save contract with address: ${this.address}`
        );
      }
      await this.queryRunner.commitTransaction();

      return contract;
    } catch (e: any) {
      await this.queryRunner.rollbackTransaction();
      throw new Error(e);
    } finally {
      await this.queryRunner.release();
    }
  }
}
