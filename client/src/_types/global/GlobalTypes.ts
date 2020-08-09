// web3 injected types, from metamask
import { WorldCoords } from '../../utils/Coordinates';
import {
  UnconfirmedMove,
  UnconfirmedUpgrade,
} from '../darkforest/api/EthereumAPITypes';
import { EventEmitter } from 'events';

interface WindowEthereumObject extends EventEmitter {
  enable: () => void;
}

export interface Web3Object {
  currentProvider: Record<string, unknown>;
}

export enum PlanetLevel {
  Asteroid,
  BrownDwarf,
  RedDwarf,
  WhiteDwarf,
  YellowStar,
  BlueStar,
  Giant,
  Supergiant,
  MAX = PlanetLevel.Supergiant,
  MIN = PlanetLevel.Asteroid,
}

export enum PlanetType {
  PLANET,
  TRADING_POST,
  MAX = PlanetType.TRADING_POST,
  MIN = PlanetType.PLANET,
}

export enum PlanetVariant {
  One,
  Two,
  MIN = PlanetVariant.One,
}

export enum PlanetResource {
  NONE,
  SILVER,
}

export enum SpaceType {
  SafeSpace,
  DeepSpace,
}

export type EnergyData = {
  energy: number;
  lastUpdated: number;
};

declare global {
  interface Window {
    // gameManager: any;
    // mimcHash: any;
    ethereum: WindowEthereumObject;
    // from websnark's function injected into window
    genZKSnarkProof: (
      witness: ArrayBuffer,
      provingKey: ArrayBuffer
    ) => Promise<WebsnarkProof>;
  }
}

export interface WebsnarkProof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
}

export type LocationId = string & {
  __value__: never;
}; // this is expected to be 64 chars, lowercase hex. see src/utils/CheckedTypeUtils.ts for constructor

export type EthAddress = string & {
  __value__: never;
}; // this is expected to be 40 chars, lowercase hex. see src/utils/CheckedTypeUtils.ts for constructor

export interface Coordinates {
  // integers
  x: number;
  y: number;
}

export interface Location {
  coords: WorldCoords;
  hash: LocationId;
  perlin: number;
}

export type Bonus = [boolean, boolean, boolean, boolean, boolean];
export type Defaults = [number, number, number, number, number];

export type ResourceData = {
  stats: Defaults;
  resourceType: PlanetResource;
};

export enum StatIdx {
  PopCap,
  PopGro,
  ResCap,
  ResGro,
  Range,
}

export type Upgrade = {
  popCapMultiplier: number;
  popGroMultiplier: number;
  silverCapMultiplier: number;
  silverGroMultiplier: number;
  silverMaxMultiplier: number;
  rangeMultiplier: number;
  silverCostMultiplier: number;
};
export type UpgradeState = [number, number, number];
export const enum UpgradeBranch {
  Silver = 0,
  Population = 1,
  Range = 2,
}
export enum PlanetClass {
  None = -1,
  Population = 0,
  Silver = 1,
  Range = 2,
}

export interface Planet {
  locationId: LocationId;
  owner: EthAddress; // should never be null; all unclaimed planets should have 0 address

  planetLevel: PlanetLevel;
  planetType: PlanetType;
  planetResource: PlanetResource;

  populationCap: number;
  populationGrowth: number;

  silverCap: number;
  silverGrowth: number;

  range: number;

  silverMax: number;

  population: number;
  silver: number;

  // metadata stuff
  isInitialized?: boolean; // TODO consider making these non-optional
  version?: number;
  lastUpdated: number;
  upgradeState: UpgradeState;

  unconfirmedDepartures: UnconfirmedMove[];
  unconfirmedUpgrades: UnconfirmedUpgrade[];
  silverSpent: number;
}
/*
export interface QueuedArrival {
  arrivalId: string;
  departureTime: number;
  arrivalTime: number;
  // TODO should this be Address?
  player: string;
  oldLoc: LocationId;
  newLoc: LocationId;
  maxDist: number;
  shipsMoved: number;
  silverMoved: number;
}
*/

export type QueuedArrival = {
  eventId: string;
  player: EthAddress;
  fromPlanet: LocationId;
  toPlanet: LocationId;
  popArriving: number;
  silverMoved: number;
  departureTime: number;
  arrivalTime: number;
};

export interface ArrivalWithTimer {
  arrivalData: QueuedArrival;
  timer: ReturnType<typeof setTimeout>;
}

export interface PlanetMap {
  [planetId: string]: Planet;
}

export interface PlanetLocationMap {
  [planetId: string]: Location;
}

// ONLY USED FOR GAMEMANAGER/PLANETHELPER CONSTRUCTOR
export interface VoyageContractData {
  [arrivalId: string]: QueuedArrival;
}

export interface VoyageMap {
  [arrivalId: string]: ArrivalWithTimer;
}

export interface PlanetVoyageIdMap {
  [planetId: string]: string[]; // to arrivalIDs
}

export interface Player {
  address: EthAddress;
  twitter?: string;
}

export class PlayerMap {
  [playerId: string]: Player;
}

export interface ChunkFootprint {
  bottomLeft: WorldCoords;
  sideLength: number;
}

export class ExploredChunkData {
  chunkFootprint: ChunkFootprint;
  planetLocations: Location[];
}

export interface MinerWorkerMessage {
  chunkFootprint: ChunkFootprint;
  workerIndex: number;
  totalWorkers: number;
  planetRarity: number;
  jobId: number;
  useMockHash: boolean;
}
