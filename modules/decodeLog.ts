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

  constructor({
    topics,
    data,
    action,
    address,
  }: {
    topics: string[];
    data: string;
    action: Action;
    address: string;
  }) {
    this.topics = topics;
    this.data = data;
    this.action = action;
    this.address = address;
  }

  private decode(signature: string) {
    const signatureData = SALE_HEX_SIGNATURE_LIST.find(
      (signatureData) => signatureData.hexSignature === signature
    );
    if (!signatureData) return;

    const decodedData = signatureData.decode({
      address: this.address,
      topics: this.topics,
      data: this.data,
    });

    if (decodedData?.action === this.action) {
      return decodedData;
    }
  }

  async convert(): Promise<
    T extends "Sale"
      ? SaleInterface
      : T extends "Transfer"
      ? TransferInterface
      : MintInterface
  > {
    const signature = this.topics[0];
    return this.decode(signature);
  }
}
