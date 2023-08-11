import {
  FindOperator,
  getConnection,
  getRepository,
  In,
  Not,
  QueryRunner,
} from "typeorm";
import { OpenseaCollection } from "../entities/OpenseaCollection";
import { Message } from "./kakao";
import { CreateEntityData } from "./manufactureData";
import {
  Contract,
  Contract as ContractEntity,
  NftProgressStatus,
} from "../entities/Contract";
import axios, { AxiosResponse } from "axios";
import { alchemy } from "../blockEventHandler";
import moment from "moment";
import { sleep } from "../utils";
import { ContractError } from "../entities/ContractError";

const kakaoMessage = new Message();
const openSeaConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

interface ContractCondition {
  isNFTsCreated: boolean;
  nftProgressStatus: any;
  id?: FindOperator<number>;
}

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
        `https://api.opensea.io/api/v1/asset_contract/${contractAddress}`,
        openSeaConfig
      );

      await sleep(1);

      const contractDataBySlag = await axios.get(
        `https://api.opensea.io/api/v1/collection/${contractDataByAddress.data?.collection?.slug}`,
        openSeaConfig
      );

      return { contractDataByAddress, contractDataBySlag };
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
          throw e;
        }
      }
    }
  }

  async saveContract(): Promise<ContractEntity> {
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
        const contractMetaData = await alchemy.nft.getContractMetadata(
          this.address
        );

        const newContract = {
          ...contractMetaData,
          ...(contractMetaData.openSea || {}),
          name:
            contractMetaData.name || contractMetaData.openSea?.collectionName,
        };
        delete contractMetaData.openSea;

        try {
          contract = await this.queryRunner.manager.save(
            ContractEntity,
            newContract
          );

          const { contractDataByAddress, contractDataBySlag } =
            await this.handleOpenseaContract(contract.address);

          const createEntityData = new CreateEntityData({
            snakeObject: {
              ...contractDataByAddress?.data?.collection,
              totalSupply:
                contractDataBySlag?.data?.collection?.stats?.total_supply,
              count: contractDataBySlag?.data?.collection?.stats?.count,
            },
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
      await getRepository(ContractError).save({
        address: this.address,
        returnStringData: JSON.stringify(e.message),
      });
      throw e;
    } finally {
      await this.queryRunner.release();
    }
  }
}
export class ContractService {
  async findAbortedContracts(
    limit: number,
    excludeIds?: number[]
  ): Promise<Contract[]> {
    let whereCondition: ContractCondition = {
      isNFTsCreated: false,
      nftProgressStatus: NftProgressStatus.ABORTED,
    };

    if (excludeIds && excludeIds.length) {
      whereCondition["id"] = Not(In(excludeIds));
    }

    return getRepository(Contract).find({
      where: whereCondition,
      take: limit,
    });
  }

  async findNotAbortedContracts(
    limit: number,
    excludeIds?: number[]
  ): Promise<Contract[]> {
    let whereCondition: ContractCondition = {
      isNFTsCreated: false,
      nftProgressStatus: Not(NftProgressStatus.ABORTED),
    };

    if (excludeIds && excludeIds.length) {
      whereCondition["id"] = Not(In(excludeIds));
    }

    return getRepository(Contract).find({
      where: whereCondition,
      take: limit,
    });
  }

  async getPriorityAbortedContracts(
    limit: number,
    excludeIds?: number[]
  ): Promise<Contract[]> {
    const findAbortedContracts = await this.findAbortedContracts(
      limit,
      excludeIds
    );
    let remainingLimit = limit - findAbortedContracts.length;
    if (remainingLimit > 0) {
      let findNotAbortedContracts = await this.findNotAbortedContracts(
        remainingLimit,
        excludeIds
      );
      return [...findAbortedContracts, ...findNotAbortedContracts];
    }
    return findAbortedContracts;
  }

  async updateStatus(contract: Contract, status: NftProgressStatus) {
    return getRepository(Contract).update(
      { id: contract.id },
      { nftProgressStatus: status }
    );
  }
}
