export const SEAPORT_ITEM_TYPE = {
  NATIVE: 0,
  ERC20: 1,
  ERC721: 2,
  ERC1155: 3,
  ERC721_WITH_CRITERIA: 4,
  ERC1155_WITH_CRITERIA: 5,
};

enum ItemType {
  // 0: ETH on mainnet, MATIC on polygon, etc.
  NATIVE,

  // 1: ERC20 items (ERC777 and ERC20 analogues could also technically work)
  ERC20,

  // 2: ERC721 items
  ERC721,

  // 3: ERC1155 items
  ERC1155,

  // 4: ERC721 items where a number of tokenIds are supported
  ERC721_WITH_CRITERIA,

  // 5: ERC1155 items where a number of ids are supported
  ERC1155_WITH_CRITERIA,
}

interface SpentItem {
  itemType: ItemType;
  token: string;
  identifier: number;
  amount: number;
}

export interface ReceivedItem {
  itemType: ItemType;
  token: string;
  identifier: number;
  amount: number;
  recipient: string;
}

export interface OrderFulfilledEvent {
  offerer: any;
  zone: any;
  orderHash: string;
  recipient: string;
  offer: SpentItem[];
  consideration: ReceivedItem[];
}

// struct SpentItem {
//     ItemType itemType;
//     address token;
//     uint256 identifier;
//     uint256 amount;
// }

// struct ReceivedItem {
//     ItemType itemType;
//     address token;
//     uint256 identifier;
//     uint256 amount;
//     address payable recipient;
// }

// event OrderFulfilled(
//     bytes32 orderHash,
//     address indexed offerer,
//     address indexed zone,
//     address recipient,
//     SpentItem[] offer,
//     ReceivedItem[] consideration
// );
