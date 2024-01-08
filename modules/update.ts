import { getRepository } from "typeorm";
import { OpenseaCollection } from "../entities/OpenseaCollection";
import { Message } from "./kakao";
import { CreateEntityData } from "./manufactureData";
import axios from "axios";
import { sleep } from "../utils";

const openSeaConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

export class UpdateManager {
  constructor() {}

  async updateOpenseaUndefined() {
    const result = await getRepository(OpenseaCollection).find({
      where: {
        name: "undefined",
      },
      relations: ["contract"],
    });

    for (let i = 0; i < result.length; i++) {
      const openseaCollectionData = result[i];
      const contract = openseaCollectionData.contract;

      try {
        const contractDataByAddress = await axios.get(
          `https://api.opensea.io/api/v2/chain/ethereum/contract/${contract.address}`,
          openSeaConfig
        );

        await sleep(1);

        const contractDataBySlag = await axios.get(
          `https://api.opensea.io/api/v2/collections/${contractDataByAddress.data?.collection}`,
          openSeaConfig
        );

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

        getRepository(OpenseaCollection).update(
          { id: openseaCollectionData.id },
          { ...cleanedData }
        );
      } catch (e) {
        console.log(e);
      }

      await sleep(1);

      console.log(`${i + 1}/${result.length} - 완료`);
    }
  }
}
