import { BigNumber as EthersBN } from 'ethers';
import { LocationId, Upgrade } from '../../global/GlobalTypes';

// TODO write these types
export type ContractCallArgs = Array<unknown>;

export enum ZKArgIdx {
  PROOF_A,
  PROOF_B,
  PROOF_C,
  DATA,
}

export enum InitArgIdxs {
  LOCATION_ID,
  PERLIN,
  RADIUS,
}

export enum MoveArgIdxs {
  FROM_ID,
  TO_ID,
  TO_PERLIN,
  TO_RADIUS,
  DIST_MAX,
  SHIPS_SENT,
  SILVER_SENT,
}

export enum UpgradeArgIdxs {
  LOCATION_ID,
  UPGRADE_BRANCH,
}

export enum ContractEvent {
  PlayerInitialized = 'PlayerInitialized',
  ArrivalQueued = 'ArrivalQueued',
  PlanetUpgraded = 'PlanetUpgraded',
}

export enum EthereumAPIEvent {
  PlayerInit = 'PlayerInit',
  PlanetUpdate = 'PlanetUpdate',
  TxSubmitted = 'TxSubmitted',
  TxConfirmed = 'TxConfirmed',
  RadiusUpdated = 'RadiusUpdated',
}

export type InitializePlayerArgs = [
  [string, string], // proofA
  [
    // proofB
    [string, string],
    [string, string]
  ],
  [string, string], // proofC
  [string, string, string] // locationId (BigInt), perlin, radius
];

// planet locationID(BigInt), branch number
export type UpgradeArgs = [string, string];

export type MoveSnarkArgs = [
  [string, string], // proofA
  [
    // proofB
    [string, string],
    [string, string]
  ],
  [string, string], // proofC
  [
    string, // from locationID (BigInt)
    string, // to locationID (BigInt)
    string, // perlin at to
    string, // radius at to
    string // distMax
  ]
];

export type MoveArgs = [
  [string, string], // proofA
  [
    // proofB
    [string, string],
    [string, string]
  ],
  [string, string], // proofC
  [
    string, // from locationID (BigInt)
    string, // to locationID (BigInt)
    string, // perlin at to
    string, // radius at to
    string, // distMax
    string, // ships sent
    string // silver sent
  ]
];

export type UpgradeBranch = [Upgrade, Upgrade, Upgrade, Upgrade];
export type UpgradesInfo = [UpgradeBranch, UpgradeBranch, UpgradeBranch];

export interface ContractConstants {
  timeFactorPercentage: number;
  PERLIN_THRESHOLD: number;
  PLANET_RARITY: number;

  ENERGY_PER_SECOND: number;
  ENERGY_CAP: number;

  TRADING_POST_RARITY: number;
  TRADING_POST_BARBARIANS: number;
  SILVER_RARITY: number;

  defaultPopulationCap: number[];
  defaultPopulationGrowth: number[];

  defaultSilverCap: number[];
  defaultSilverGrowth: number[];

  defaultSilverMax: number[];

  defaultRange: number[];
  defaultBarbarianPercentage: number[];

  planetLevelThresholds: number[];
  planetTypeThresholds: number[];
  planetCumulativeRarities: number[];

  upgrades: UpgradesInfo;
}

export type ClientMockchainData =
  | null
  | undefined
  | number
  | string
  | boolean
  | EthersBN
  | ClientMockchainData[]
  | {
      [key in string | number]: ClientMockchainData;
    };

/*
export interface RawArrivalData {
  // note that from actual blockchain, this will be an array
  // not an object; this fields will be keyed by numerica index, not string
  arrivalId: string;
  departureTime: BigNumber;
  arrivalTime: BigNumber;
  player: string;
  oldLoc: BigNumber;
  newLoc: BigNumber;
  maxDist: BigNumber;
  shipsMoved: BigNumber;
  silverMoved: BigNumber;
}
*/
/*
export type RawQueuedArrival = {
  eventId: string;
  player: string;
  fromPlanet: BigNumber;
  toPlanet: BigNumber;
  popArriving: BigNumber;
  silverMoved: BigNumber;

  timeTrigger: BigNumber;
  timeAdded: BigNumber;
}
*/
export enum PlanetEventType {
  ARRIVAL,
}

export type RawPlanetEventMetadata = {
  id: string;
  eventType: EthersBN;
  timeTrigger: EthersBN;
  timeAdded: EthersBN;
};

export type RawUpgrade = {
  0: EthersBN;
  popCapMultiplier?: EthersBN;

  1: EthersBN;
  popGroMultiplier?: EthersBN;

  2: EthersBN;
  silverCapMultiplier?: EthersBN;

  3: EthersBN;
  silverGroMultiplier?: EthersBN;

  4: EthersBN;
  silverMaxMultiplier?: EthersBN;

  5: EthersBN;
  rangeMultiplier?: EthersBN;

  6: EthersBN;
  silverCostMultiplier?: EthersBN;
};

export type RawUpgradesInfo = [
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade],
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade],
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade]
];

export type RawArrivalData = {
  0: EthersBN;
  id?: EthersBN;

  1: string;
  player?: string;

  2: EthersBN;
  fromPlanet?: EthersBN;

  3: EthersBN;
  toPlanet?: EthersBN;

  4: EthersBN;
  popArriving?: EthersBN;

  5: EthersBN;
  silverMoved?: EthersBN;

  6: EthersBN;
  departureTime?: EthersBN;

  7: EthersBN;
  arrivalTime?: EthersBN;
};

export type RawDefaults = {
  0: string;
  label?: string;

  1: EthersBN;
  populationCap?: EthersBN;

  2: EthersBN;
  populationGrowth?: EthersBN;

  3: EthersBN;
  range?: EthersBN;

  4: EthersBN;
  silverGrowth?: EthersBN;

  5: EthersBN;
  silverCap?: EthersBN;

  6: EthersBN;
  silverMax?: EthersBN;

  7: EthersBN;
  barbarianPercentage?: EthersBN;

  8: EthersBN;
  energyCost?: EthersBN;
}[];

export interface RawPlanetData {
  // note that from actual blockchain, this will be an array
  // not an object; this fields will be keyed by numerical index, not string
  0: string;
  owner?: string;

  1: EthersBN;
  range?: EthersBN;

  2: EthersBN;
  population?: EthersBN;

  3: EthersBN;
  populationCap?: EthersBN;

  4: EthersBN;
  populationGrowth?: EthersBN;

  5: number;
  planetResource?: number;

  6: EthersBN;
  silverCap?: EthersBN;

  7: EthersBN;
  silverGrowth?: EthersBN;

  8: EthersBN;
  silver?: EthersBN;

  9: EthersBN;
  silverMax?: EthersBN;

  10: EthersBN;
  planetLevel?: EthersBN;

  11: number;
  planetType?: number;
}

export interface RawPlanetExtendedInfo {
  // note that from actual blockchain, this will be an array
  // not an object; this fields will be keyed by numerical index, not string
  0: boolean;
  isInitialized?: boolean;

  1: EthersBN;
  version?: EthersBN;

  2: EthersBN;
  lastUpdated?: EthersBN;

  3: EthersBN;
  upgradeState0?: EthersBN;

  4: EthersBN;
  upgradeState1?: EthersBN;

  5: EthersBN;
  upgradeState2?: EthersBN;
}

export enum EthTxType {
  INIT = 'INIT',
  MOVE = 'MOVE',
  UPGRADE = 'UPGRADE',
}

export interface UnconfirmedTx {
  type: EthTxType;
  txHash: string;
  sentAtTimestamp: number;
}

export interface UnconfirmedInit extends UnconfirmedTx {
  type: EthTxType.INIT;
  locationId: LocationId;
}

export interface UnconfirmedMove extends UnconfirmedTx {
  type: EthTxType.MOVE;
  from: LocationId;
  to: LocationId;
  forces: number;
  silver: number;
}

export interface UnconfirmedUpgrade extends UnconfirmedTx {
  type: EthTxType.UPGRADE;
  locationId: LocationId;
  upgradeBranch: number; // 0, 1, or 2
}
