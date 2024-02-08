import {
  FindOperator,
  getConnection,
  getRepository,
  QueryRunner,
} from "typeorm";
import { OpenseaCollection } from "../entities/OpenseaCollection";
import { Message } from "./kakao";
import { CreateEntityData } from "./manufactureData";
import { Contract as ContractEntity } from "../entities/Contract";
import axios from "axios";
import moment from "moment";
import { getContractDetails, sleep } from "../utils";

const kakaoMessage = new Message();
const openSeaConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

export class ContractManager {
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
  ): Promise<any> {
    try {
      const contractDataByAddress = await axios.get(
        `https://api.opensea.io/api/v2/chain/ethereum/contract/${contractAddress}`,
        openSeaConfig
      );
      await sleep(1);

      let contractDataBySlag;
      try {
        contractDataBySlag = await axios.get(
          `https://api.opensea.io/api/v2/collections/${contractDataByAddress.data?.collection}`,
          openSeaConfig
        );
      } catch (e) {
        return { contractDataByAddress, contractDataBySlag: null };
      }

      return { contractDataByAddress, contractDataBySlag };
    } catch (e: any) {
      if (e.response && e.response.status !== 404) {
        if (e.response.status === 400) {
          const errorMessage = e.response?.data?.errors?.[0];
          if (errorMessage) {
            // 'Contract address'와 'not found'가 모두 포함되어 있는지 확인
            if (
              errorMessage.includes("Contract address") &&
              errorMessage.includes("not found")
            ) {
              return { contractDataByAddress: null, contractDataBySlag: null };
            }
          }
        }

        if (retryCount > 0) {
          await sleep(3);
          return this.handleOpenseaContract(contractAddress, retryCount - 1);
        } else {
          await kakaoMessage.sendMessage(
            `${moment(new Date()).format(
              "MM/DD HH:mm"
            )}\n\nopensea error - handleOpenseaContract`
          );
          throw e;
        }
      }
    }
  }

  async saveContract(
    tokenId: number | string,
    alchemy: any
  ): Promise<ContractEntity> {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    try {
      let contract = await this.queryRunner.manager
        .createQueryBuilder(ContractEntity, "contractEntity")
        .where("LOWER(contractEntity.address) = LOWER(:address)", {
          address: this.address,
        })
        .getOne();

      if (!contract) {
        const contractMetaData = await getContractDetails(
          this.address,
          tokenId,
          alchemy
        );

        const newContract = {
          ...contractMetaData,
          name: contractMetaData.name,
        };

        try {
          contract = await this.queryRunner.manager.save(
            ContractEntity,
            newContract as any
          );

          if (!contract) throw new Error("Failed to save contract");

          const { contractDataByAddress, contractDataBySlag } =
            await this.handleOpenseaContract(contract.address);

          const snakeObject = {
            ...contractDataBySlag?.data,
            slug: contractDataBySlag?.data?.collection,
            totalSupply: contractDataByAddress?.data?.supply,
            count: contractDataByAddress?.data?.supply,
          };

          const createEntityData = new CreateEntityData({
            snakeObject,
            entity: OpenseaCollection,
            filterList: ["id"],
          });

          interface AdditionalData {
            createdDate?: Date;
          }

          const additionalData: AdditionalData = {};

          if (contractMetaData && contractMetaData.createdDate) {
            additionalData.createdDate = contractMetaData.createdDate;
          }

          const removeUndefinedFields = (obj: any) => {
            return Object.keys(obj).reduce((acc: any, key) => {
              if (obj[key] !== undefined) {
                acc[key] = obj[key];
              }
              return acc;
            }, {});
          };

          const data = createEntityData.createTableRowData();
          const cleanedData = removeUndefinedFields(data);

          const openseaCollection = await this.queryRunner.manager.save(
            OpenseaCollection,
            {
              ...cleanedData,
              ...additionalData,
              contract,
            }
          );

          await this.queryRunner.manager.update(
            ContractEntity,
            {
              id: contract.id,
            },
            {
              openseaCollection,
            }
          );
        } catch (e: any) {
          if (e.code === "23505") {
            contract = await getRepository(ContractEntity)
              .createQueryBuilder("contractEntity")
              .where("LOWER(contractEntity.address) = LOWER(:address)", {
                address: this.address,
              })
              .getOne();
          } else {
            throw e;
          }
        }
      }
      if (!contract) {
        throw `Failed to find or save contract with address: ${this.address}`;
      }
      await this.queryRunner.commitTransaction();
      return contract;
    } catch (e: any) {
      await this.queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await this.queryRunner.release();
    }
  }
}
