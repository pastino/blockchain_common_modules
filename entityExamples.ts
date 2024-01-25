import * as dotenv from 'dotenv';
import { TimeRange } from './entities/TrendUpcomingCollection';

dotenv.config({ path: __dirname + '/../../../.env.dev' });
const isNestJs = process.env.APP_TYPE === 'nestjs';

export var traitTypeContractExample = {
  id: 1,
  traitType: traitTypeExample,
  contract: contractExample,
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export const contractDetailExample: any = {
  id: 1,
  contract: contractExample,
  detailDescription: '',
  benefits: [benefitExample],
  loadmaps: [loadmapExample],
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var benefitExample: any = {
  id: 1,
  contractDetail: contractDetailExample,
  benefit: '',
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var loadmapExample: any = {
  id: 1,
  contractDetail: contractDetailExample,
  loadmap: '',
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var contractExample: any = {
  id: 1,
  openseaCollection: openseaCollectionExample,
  address: '0xd774557b647330c91bf44cfeab205095f7e6c367',
  tokenId: '',
  name: 'Nakamigos',
  totalSupply: '20000',
  isSpam: '',
  imageUrl:
    'https://i.seadn.io/gcs/files/beabfabb47c6baeb6008f21bc0681986.jpg?w=500&auto=format',
  description: '',
  externalUrl: 'https://www.0xhoneyjar.xyz/',
  twitterUsername: '',
  discordUrl: '',
  symbol: 'HONEYCOMB',
  tokenType: 'ERC721',
  contractDeployer: '0xf951ba8107d7bf63733188e64d7e07bd27b46af7',
  deployedBlockNumber: '16751283',
  nfts: [nftExample],
  logs: [logExample],
  contractDetail: [contractDetailExample],
  trendCollections: [trandCollectionExample],
  isNFTsCreated: true,
  nftProgressStatus: 'in_progress',
  createdNFTsPageNumber: 1,
  createdNFTsPageKey: '0x0000000',
  alchemyCollectionError: 'error',
  traitTypeContracts: [traitTypeContractExample],
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var openseaCollectionExample: any = {
  id: 9192,
  contract: contractExample,
  totalSupply: 10000,
  count: 10000,
  bannerImageUrl:
    'https://i.seadn.io/gcs/files/602bb22216c2c2ffac0f45f14991a025.png?w=500&auto=format',
  createdDate: new Date(),
  description:
    'Every 30 Days (E30D) is a month-long exhibition of a single,...',
  floorPrice: 0.1,
  discordUrl: 'https://discord.gg/3qjUuqX',
  externalUrl: 'https://www.every30days.com/',
  imageUrl:
    'https://i.seadn.io/gcs/files/602bb22216c2c2ffac0f45f14991a025.png?w=500&auto=format',
  largeImageUrl:
    'https://i.seadn.io/gcs/files/602bb22216c2c2ffac0f45f14991a025.png?w=500&auto=format',
  mediumUsername: 'every30days',
  name: 'Every 30 Days',
  shortDescription:
    'Every 30 Days (E30D) is a month-long exhibition of a single,...',
  slug: 'every30days',
  telegramUrl: 'https://t.me/every30days',
  twitterUsername: 'every30days',
  instagramUsername: 'every30days',
  wikiUrl: 'https://wiki.opensea.io/collection-wiki/every-30-days',
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export const upcomingTwitterExample: any = {
  id: 1,
  upcomingContract: upcomingContractExample,
  followerCount: 4323,
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export const upcomingDiscordExample: any = {
  id: 1,
  upcomingContract: upcomingContractExample,
  joinCount: 4323,
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var upcomingContractExample: any = {
  id: 1,
  // openseaCollection: openseaCollectionExample,
  address: '0xd774557b647330c91bf44cfeab205095f7e6c367',
  tokenId: '',
  name: 'Nakamigos',
  totalSupply: '20000',
  isSpam: '',
  imageUrl:
    'https://i.seadn.io/gcs/files/beabfabb47c6baeb6008f21bc0681986.jpg?w=500&auto=format',
  description: '',
  externalUrl: 'https://www.0xhoneyjar.xyz/',
  twitterUsername: '',
  discordUrl: '',
  symbol: 'HONEYCOMB',
  tokenType: 'ERC721',
  contractDeployer: '0xf951ba8107d7bf63733188e64d7e07bd27b46af7',
  deployedBlockNumber: '16751283',
  nfts: [nftExample],
  logs: [logExample],
  trendCollections: [trandCollectionExample],
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var trendUpcomingCollectionExample: any = {
  id: 1,
  upcomingContract: upcomingContractExample,
  timeRange: '1D',
  twitterFollowerCount: 5752,
  twitterBeforeFollowerCount: 5761,
  twitterDeviation: -9.0,
  twitterDeviationPercent: -0.1562228779725742,
  discordJoinCount: 18878,
  discordBeforeJoinCount: 19008,
  discordDeviation: -130.0,
  discordDeviationPercent: -0.6839225589225589,
  staticCreateAt: new Date(),
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var traitTypeExample: any = {
  id: 1,
  traitType: 'Body',
  traitTypeContracts: traitTypeContractExample,
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var attributePropertyExample: any = {
  id: 1,
  attribute: attributeExample,
  value: 'yellow',
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var attributeExample: any = {
  id: 1,
  contract: contractExample,
  traitType: 'Color',
  properties: [attributePropertyExample],
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var attributePropNFTMappingExample: any = {
  id: 1,
  property: attributePropertyExample,
  nft: nftExample,
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var attributeNFTExample: any = {
  id: 1,
  attribute: 1,
  nft: nftExample,
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var nftExample: any = {
  id: 1,
  contract: isNestJs ? contractExample : {},
  tokenId: '1',
  tokenType: 'ERC721',
  title: 'Elon Digital Trading Card #4002',
  description: 'Elon Digital Trading Card #4002',
  mediaThumbnail:
    'https://res.cloudinary.com/alchemyapi/image/upload/thumbnailv2/eth-mainnet/7a8e611db27db860b63171dc1c38d0ab',
  rawMetadataImage: '',
  attributesRaw: 'https://mint.fun/api/mintfun/fundrop/token/105770.json',
  imageRaw: 'https://mint.fun/api/mintfun/fundrop/token-image/105770.png',
  imageFormat: 'png',
  imageBytes: 483012,
  imageRoute: 'd07bc5cf1d899c6e89937e1132b8851f.png',
  attributeNFTs: [attributeExample],
  isImageUploaded: true,
  imageSaveError: 'Request failed with status code 523',
  isAttributeUpdated: true,
  logs: [logExample],
  imageAlchemyUrl:
    'https://res.cloudinary.com/alchemyapi/image/upload/thumbnailv2/eth-mainnet/386fcc4e38a78df1e247f3c3fec64e32',
  alchemyImageError: '',
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var topicExample: any = {
  id: 1,
  index: 0,
  log: logExample,
  topic: '0x000000',
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var logExample: any = {
  id: 1,
  contract: isNestJs ? contractExample : {},
  nft: isNestJs ? nftExample : {},
  transactionIndex: 83,
  blockNumber: 17037537,
  transactionHash:
    '0x814f79d996ac8fc90042dd125f57a55662ff8eef37c891691c2d93086157e1c7',
  address: '0xd04FF5E94340A2e1d913c3728a12B210C5D5Bb2D',
  data: '0x',
  logIndex: 1,
  blockHash:
    '0x9750122e45a4e263d1aa0c85704d182a96f4f9103a3c924b22411b26fac1a8f1',
  topics: [topicExample],
  transaction: [transactionExample],
  decodedLog: [decodedLogExample],
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var transactionExample: any = {
  id: 1,
  hash: '0x44f844f2bc8c75487279521e55295559f2c8ab033cbb20f057566749741b94b9',
  timestamp: 1681375367,
  contract: contractExample,
  eventTime: new Date(),
  blockHash:
    '0xe8adada749676a12821729e77ac15b7ebb0d3d48420f60d6345bc078fcf80a80',
  blockNumber: blockNumberExample,
  transactionIndex: 88,
  confirmations: 4,
  to: '0x0000000000664ceffed39244a8312bD895470803',
  from: '0x7c2c65F75654772E495001D4AeB85F92a62616B0',
  gasPrice: '32235896003',
  gasLimit: '81826',
  value: '17000000000000000',
  nonce: 16,
  data: '0x',
  chainId: 1,
  logs: [logExample],
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var blockNumberExample: any = {
  id: 1,
  blockNumber: 17042542,
  transactions: [transactionExample],
  isNFTCompletedUpdate: true,
  isCompletedUpdate: true,
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var trandCollectionExample: any = {
  id: 1,
  contract: isNestJs ? contractExample : {},
  floorPrice: 0.945,
  volume: 45.3,
  timeRange: '1H',
  sales: 35,
  staticCreateAt: new Date(),
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

export var decodedLogExample: any = {
  id: 3491589,
  log: logExample,
  transaction: transactionExample,
  contract: contractExample,
  nft: nftExample,
  action: 'Sale',
  contractAddress: '0x950b9476a4de757BB134483029AC4Ec17E739e3A',
  tokenId: '1232',
  from: '0x379CAdAb8F98bF10121E2e9B7fc02CA802345E8b',
  to: '0x8F36b6A8B4Ef5636e914cE69CBC82f717b3D8A16',
  ethValue: 0.105,
  unit: 'ETH',
  value: 0.105,
  platform: 'Blur',
  quantity: 1,
  minterAddress: null,
  stage: null,
  mintCount: null,
  timestamp: 1686127775,
  eventTime: new Date(),
  gasUsed: '271702',
  cumulativeGasUsed: '2801448',
  effectiveGasPrice: '24104367208',
  gasPrice: '24104367208',
  gasLimit: '460964',
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
  transactionFee: '0.105',
};
