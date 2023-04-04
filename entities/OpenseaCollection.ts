import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Contract } from "./Contract";

@Entity({ name: "openseaCollection" })
export class OpenseaCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Contract, (contract) => contract.openseaCollection, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true })
  bannerImageUrl: string;

  @Column({ nullable: true })
  createdDate: Date;

  @Column({ type: "longtext", nullable: true })
  description: string;

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  largeImageUrl: string;

  @Column({ nullable: true })
  mediumUsername: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  shortDescription: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  telegramUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;

  @Column({ nullable: true })
  instagramUsername: string;

  @Column({ nullable: true })
  wikiUrl: string;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}

//   banner_image_url: 'https://i.seadn.io/gcs/files/c94580ac1ee81e6d9e2c355245da5264.png?w=500&auto=format',
//       chat_url: null,
//       created_date: '2023-03-22T16:37:49.287637+00:00',
//       default_to_fiat: false,
//       description: 'CoreCard is a decentralized pass based on the Coresky ecosystem. On the Coresky platform, users can bind their CoreCard, and each week, the CoreCard will generate a certain number of tickets. These tickets can be used to participate in Coresky Launchpad activities, in order to obtain Asset-packaged NFTs of various Web3 projects.',
//       dev_buyer_fee_basis_points: '0',
//       dev_seller_fee_basis_points: '0',
//       discord_url: 'https://discord.gg/coresky',
//       display_data: [Object],
//       external_url: 'https://home.coresky.com/',
//       featured: false,
//       featured_image_url: null,
//       hidden: false,
//       safelist_request_status: 'not_requested',
//       image_url: 'https://i.seadn.io/gcs/files/755fcc48fcdbe37ab1c3ee6f862e5f75.png?w=500&auto=format',
//       is_subject_to_whitelist: false,
//       large_image_url: null,
//       medium_username: 'info_Coresky',
//       name: 'CoreCard',
//       only_proxied_transfers: false,
//       opensea_buyer_fee_basis_points: '0',
//       opensea_seller_fee_basis_points: 50,
//       payout_address: null,
//       require_email: false,
//       short_description: null,
//       slug: 'corecard',
//       telegram_url: null,
//       twitter_username: 'Coreskyofficial',
//       instagram_username: null,
//       wiki_url: null,
//       is_nsfw: false,
//       fees: [Object],
//       is_rarity_enabled: false,
//       is_creator_fees_enforced: false
