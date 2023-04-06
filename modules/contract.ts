import { QueryRunner } from "typeorm";
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

  constructor({
    address,
    queryRunner,
  }: {
    address: string;
    queryRunner: QueryRunner;
  }) {
    this.address = address;
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
    let contract = await this.queryRunner.manager.findOne(ContractEntity, {
      where: {
        address: this.address,
      },
    });

    if (!contract) {
      const contractMetaData = await alchemy.nft.getContractMetadata(
        this.address
      );

      const newContract = {
        ...contractMetaData,
        ...contractMetaData.openSea,
        name: contractMetaData.name || contractMetaData.openSea?.collectionName,
      };
      delete contractMetaData.openSea;

      try {
        contract = await this.queryRunner.manager.save(
          ContractEntity,
          newContract
        );
        const openseaData = await this.handleOpenseaContract(contract.address);
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
          contract = await this.queryRunner.manager.findOne(ContractEntity, {
            where: {
              address: this.address,
            },
          });
        } else {
          console.error("Unexpected error:", e);
        }
      }
    }
    if (!contract) {
      throw new Error(
        `Failed to find or save contract with address: ${this.address}`
      );
    }
    return contract;
  }
}
