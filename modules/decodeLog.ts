import { SALE_HEX_SIGNATURE_LIST } from "../ABI";

export type Action = "Sale" | "Transfer";

export class DecodeLog {
  private topics: string[];
  private data: string;
  private action: Action;

  constructor({
    topics,
    data,
    action,
  }: {
    topics: string[];
    data: string;
    action: Action;
  }) {
    this.topics = topics;
    this.data = data;
    this.action = action;
  }

  private convertSale(signature: string) {
    const signatureData = SALE_HEX_SIGNATURE_LIST.find(
      (signatuerData) => signatuerData.hexSignature === signature
    );
    if (!signatureData) return;

    // return signatureData.decode(this.topics, this.data);
    return "";
  }

  private convertTransfer(signature: string) {
    const signatureData = SALE_HEX_SIGNATURE_LIST.find(
      (signatuerData) => signatuerData.hexSignature === signature
    );
    if (!signatureData) return;

    // return signatureData.decode(this.topics, this.data);
    return "";
  }

  async convert() {
    const signature = this.topics[0];

    switch (this.action) {
      case "Sale":
        return this.convertSale(signature);
      case "Transfer":
        return this.convertTransfer(signature);
      default:
        const sale = await this.convertSale(signature);
        if (sale) return sale;
        const transfer = await this.convertTransfer(signature);
        if (transfer) return transfer;
        return null;
    }
  }
}
