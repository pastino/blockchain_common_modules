import { SALE_HEX_SIGNATURE_LIST } from "../ABI";

type Action = "Sale" | "Transfer";

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

    return signatureData.decode(this.topics, this.data);
  }

  public convert() {
    const signature = this.topics[0];

    switch (this.action) {
      case "Sale":
        return this.convertSale(signature);
      // case "Transfer":
      //   return this.convertTransfer(signature);
      default:
        return null;
    }
  }
}
