import * as _ from "lodash";
import { getConnection } from "typeorm";

export class CreateEntityData {
  private snakeObject = {};
  private entity = {};
  private filterList;

  constructor({
    snakeObject,
    entity,
    filterList,
  }: {
    snakeObject: {};
    entity: {};
    filterList?: string[] | [];
  }) {
    this.snakeObject = snakeObject;
    this.entity = entity;
    this.filterList = filterList;
  }

  // response 데이터 snake case 키값을 camel case로 변경
  private snakeToCamelObject = () => {
    return _.mapKeys(this.snakeObject, (value: string, key: string) =>
      _.camelCase(key)
    );
  };

  // Entity 키값 리스트 얻기
  private getEntityKeyList = () => {
    const keyList = Object.keys(
      getConnection().getRepository(this.entity as never).metadata.propertiesMap
    );
    const basicFilterList = ["createAt", "updateAt"];
    return keyList.filter(
      (key) => ![...basicFilterList, ...(this.filterList || [])]?.includes(key)
    );
  };

  // Table Row 데이터 생성
  createTableRowData = () => {
    const createData = this.snakeToCamelObject();

    const createRowData: any = {};

    const collectionKeyList = this.getEntityKeyList();
    collectionKeyList.map(
      (key: string) => (createRowData[key] = createData[key])
    );

    return createRowData;
  };
}
