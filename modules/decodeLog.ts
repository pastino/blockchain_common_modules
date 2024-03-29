import {
  SaleInterface,
  SALE_HEX_SIGNATURE_LIST,
  TransferInterface,
  MintInterface,
} from "../ABI";

export type Action = "Sale" | "Transfer" | "Mint";

export class DecodeLog<T extends Action> {
  private topics: string[];
  private data: string;
  private action: Action;
  private address: string;
  private log: any;
  private logs: any;

  constructor({
    topics,
    data,
    action,
    address,
    log,
    logs,
  }: {
    topics: string[];
    data: string;
    action: Action;
    address: string;
    log: any;
    logs: any;
  }) {
    this.topics = topics;
    this.data = data;
    this.action = action;
    this.address = address;
    this.log = log;
    this.logs = logs;
  }

  private async decode(signature: string) {
    // const signatureData = SALE_HEX_SIGNATURE_LIST.find(
    //   (signatureData) => signatureData.hexSignature === signature
    // );
    // if (!signatureData) return;

    // const decodedData = await signatureData.decode({
    //   address: this.address, // Sale에서는 사용 안함, Transfer에서는 Contract address로 사용함
    //   topics: this.topics,
    //   data: this.data,
    //   log: this.log,
    //   logs: this.logs,
    //   blockNumber: 1,
    // });

    // if (decodedData?.action === this.action) {
    //   return decodedData;
    // }
    return null;
  }

  async convert(): Promise<any> {
    const signature = this.topics[0];
    return this.decode(signature);
  }
}
