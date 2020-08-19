import {
  EthAddress,
  ExploredChunkData,
  Planet,
  Location,
  LocationId,
  QueuedArrival,
  PlanetLevel,
  Player,
  Upgrade,
} from '../_types/global/GlobalTypes';
import { EventEmitter } from 'events';
import { WorldCoords } from '../utils/Coordinates';
import {
  UnconfirmedMove,
  UnconfirmedUpgrade,
} from '../_types/darkforest/api/EthereumAPITypes';
import { MiningPattern } from '../utils/MiningPatterns';

export default interface AbstractGameManager extends EventEmitter {
  destroy(): void;

  getAccount(): EthAddress | null;
  getContractAddress(): EthAddress;
  getTwitter(address: EthAddress | null): string | null;
  getEndTimeSeconds(): number;
  getUpgrade(branch: number, level: number): Upgrade;
  getDefaultSilver(planet: Planet): number;
  getPopulationCurveAtPercent(planet: Planet, percent: number): number;
  getSilverCurveAtPercent(planet: Planet, percent: number): number | null;

  getAllPlayers(): Player[];
  getExploredChunks(): Iterable<ExploredChunkData>;
  getWorldRadius(): number;
  getWorldSilver(): number;
  getWorldPop(): number;
  getSilverOfPlayer(player: EthAddress): number;
  getPopOfPlayer(player: EthAddress): number;
  getPlanetWithId(planetId: LocationId): Planet | null; // null if this planet is not in smart contract
  getPlanetWithCoords(coords: WorldCoords): Planet | null; // null if not a valid location or if no planet exists at location
  getPlanetWithLocation(location: Location): Planet | null; // null if not a valid location or if no planet exists at location
  getPlanetLevel(planetId: LocationId): PlanetLevel | null; // null if planet is neither in contract nor known chunks. fast; doesn't update planet
  getPlanetDetailLevel(planetId: LocationId): number | null; // null if planet is neither in contract nor known chunks. fast; doesn't update planet
  getLocationOfPlanet(planetId: LocationId): Location | null; // null if we don't know the location of this planet
  getAllOwnedPlanets(): Planet[];
  getAllVoyages(): QueuedArrival[];
  getUnconfirmedMoves(): UnconfirmedMove[];
  getUnconfirmedUpgrades(): UnconfirmedUpgrade[];
  getHomeCoords(): WorldCoords | null;
  hasJoinedGame(): boolean;
  getEnergyNow(): number;
  getHashesPerSec(): number;
  getSignedTwitter(twitter: string): Promise<string>;

  setMiningPattern(pattern: MiningPattern): void;
  getMiningPattern(): MiningPattern | null;
  startExplore(): void;
  stopExplore(): void;

  verifyTwitter(twitter: string): Promise<boolean>;
  joinGame(): AbstractGameManager;
  addAccount(coords: WorldCoords): Promise<boolean>;
  move(
    from: Planet,
    to: Planet,
    forces: number,
    silver: number
  ): AbstractGameManager;
  upgrade(planet: Planet, branch: number): AbstractGameManager;
  addNewChunk(chunk: ExploredChunkData): AbstractGameManager;
}
