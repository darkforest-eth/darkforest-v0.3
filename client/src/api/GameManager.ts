import { EventEmitter } from 'events';
import {
  EthAddress,
  Location,
  Planet,
  PlanetMap,
  Player,
  PlayerMap,
  QueuedArrival,
  PlanetVoyageIdMap,
  LocationId,
  ExploredChunkData,
  VoyageContractData,
  PlanetLevel,
  EnergyData,
  SpaceType,
  PlanetType,
  Upgrade,
} from '../_types/global/GlobalTypes';
import LocalStorageManager from './LocalStorageManager';
import {
  MIN_CHUNK_SIZE,
  LOCATION_ID_UB,
  MAX_CHUNK_SIZE,
} from '../utils/constants';
import mimcHash from '../miner/mimc';
import EthereumAPI from './EthereumAPI';
import MinerManager, { MinerManagerEvent } from './MinerManager';
import SnarkHelper from './SnarkArgsHelper';
import { WorldCoords } from '../utils/Coordinates';
import _ from 'lodash';

import { SpiralPattern, MiningPattern } from '../utils/MiningPatterns';
import AbstractGameManager from './AbstractGameManager';
import {
  ContractConstants,
  UnconfirmedTx,
  UnconfirmedMove,
  EthereumAPIEvent,
  UpgradeArgs,
  UnconfirmedUpgrade,
} from '../_types/darkforest/api/EthereumAPITypes';
import perlin from '../miner/perlin';
import { PlanetHelper } from './PlanetHelper';
import { fakeHash } from '../miner/permutation';
import {
  locationIdFromBigInt,
  locationIdToBigNumber,
  address,
} from '../utils/CheckedTypeUtils';

export enum GameManagerEvent {
  PlanetUpdate = 'PlanetUpdate',
  DiscoveredNewChunk = 'DiscoveredNewChunk',
  InitializedPlayer = 'InitializedPlayer',
  InitializedPlayerError = 'InitializedPlayerError',
  Moved = 'Moved',
  EnergyUpdate = 'EnergyUpdate',
}
import { addAccountToBrowser } from './BrowserChecks';
import TerminalEmitter from '../utils/TerminalEmitter';
import { getAllTwitters, verifyTwitterHandle } from './UtilityServerAPI';

class GameManager extends EventEmitter implements AbstractGameManager {
  private readonly account: EthAddress | null;
  private readonly players: PlayerMap;

  private readonly ethereumAPI: EthereumAPI;
  private readonly localStorageManager: LocalStorageManager;
  private readonly snarkHelper: SnarkHelper;
  private readonly planetHelper: PlanetHelper;

  private readonly useMockHash: boolean;

  private minerManager?: MinerManager;
  private hashRate: number;

  private energyData: EnergyData | null;

  private homeCoords: WorldCoords | null;
  private readonly contractConstants: ContractConstants;

  private worldRadius: number;

  private get perlinThreshold(): number {
    return this.contractConstants.PERLIN_THRESHOLD;
  }
  private get planetRarity(): number {
    return this.contractConstants.PLANET_RARITY;
  }

  private readonly endTimeSeconds: number = 1597464000;

  private constructor(
    account: EthAddress | null,
    players: PlayerMap,
    planets: PlanetMap,
    worldRadius: number,
    unprocessedArrivals: VoyageContractData,
    unprocessedPlanetArrivalIds: PlanetVoyageIdMap,
    ethereumAPI: EthereumAPI,
    contractConstants: ContractConstants,
    localStorageManager: LocalStorageManager,
    snarkHelper: SnarkHelper,
    homeCoords: WorldCoords | null,
    useMockHash: boolean
  ) {
    super();

    this.account = account;
    this.players = players;
    this.worldRadius = worldRadius;

    this.contractConstants = contractConstants;
    this.homeCoords = homeCoords;

    this.planetHelper = new PlanetHelper(
      planets,
      localStorageManager,
      unprocessedArrivals,
      unprocessedPlanetArrivalIds,
      contractConstants,
      this.endTimeSeconds
    );
    this.ethereumAPI = ethereumAPI;
    this.localStorageManager = localStorageManager;
    this.snarkHelper = snarkHelper;
    this.useMockHash = useMockHash;

    this.hashRate = 0;
  }

  public destroy(): void {
    // removes singletons of EthereumAPI, LocalStorageManager, MinerManager
    if (this.minerManager) {
      this.minerManager.removeAllListeners(
        MinerManagerEvent.DiscoveredNewChunk
      );
      this.minerManager.destroy();
    }
    this.ethereumAPI.removeAllListeners(EthereumAPIEvent.PlayerInit);
    this.ethereumAPI.removeAllListeners(EthereumAPIEvent.PlanetUpdate);
    this.ethereumAPI.destroy();
    this.localStorageManager.destroy();
    this.snarkHelper.destroy();
  }

  static async create(useMockHash = false): Promise<GameManager> {
    // initialize dependencies according to a DAG

    // first we initialize the EthereumAPI and get the user's eth account, and load contract constants + state
    const ethereumAPI = await EthereumAPI.create();
    /*
    const ethereumAPI = await EthereumAPI.createMock(
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/mockchain'
        //: 'https://dark-forest.online'
        : '/mockchain'
    );
    */
    // then we initialize the local storage manager and SNARK helper
    const account = ethereumAPI.account;
    const localStorageManager = await LocalStorageManager.create(account);
    const homeCoords = await localStorageManager.getHomeCoords();
    const snarkHelper = await SnarkHelper.create(useMockHash);

    // get data from the contract
    const contractConstants = await ethereumAPI.getConstants();
    const players = await ethereumAPI.getPlayers();
    const planets = await ethereumAPI.getPlanets();
    const worldRadius = await ethereumAPI.getWorldRadius();

    const arrivals: VoyageContractData = {};
    const planetVoyageIdMap: PlanetVoyageIdMap = {};
    const arrivalPromises: Promise<null>[] = [];
    const allArrivals = await ethereumAPI.getAllArrivals();
    for (const planetId in planets) {
      if (planets.hasOwnProperty(planetId)) {
        planetVoyageIdMap[planetId] = [];
      }
    }
    for (const arrival of allArrivals) {
      planetVoyageIdMap[arrival.toPlanet].push(arrival.eventId);
      arrivals[arrival.eventId] = arrival;
    }
    await Promise.all(arrivalPromises);

    const gameManager = new GameManager(
      account,
      players,
      planets,
      worldRadius,
      arrivals,
      planetVoyageIdMap,
      ethereumAPI,
      contractConstants,
      localStorageManager,
      snarkHelper,
      homeCoords,
      useMockHash
    );

    // get twitter handles
    gameManager.refreshTwitters();

    // set up listeners: whenever EthereumAPI reports some game state update, do some logic
    gameManager.ethereumAPI
      .on(EthereumAPIEvent.PlayerInit, (player: Player) => {
        gameManager.players[player.address] = player;
      })
      .on(EthereumAPIEvent.PlanetUpdate, async (planet: Planet) => {
        const arrivals = await ethereumAPI.getArrivalsForPlanet(planet);
        gameManager.planetHelper.refreshPlanetAndArrivals(planet, arrivals);
        gameManager.emit(GameManagerEvent.PlanetUpdate);
      })
      .on(EthereumAPIEvent.TxSubmitted, (unconfirmedTx: UnconfirmedTx) => {
        gameManager.planetHelper.onTxSubmit(unconfirmedTx);
        gameManager.localStorageManager.onEthTxSubmit(unconfirmedTx);
      })
      .on(EthereumAPIEvent.TxConfirmed, (unconfirmedTx: UnconfirmedTx) => {
        gameManager.planetHelper.onTxConfirm(unconfirmedTx);
        gameManager.localStorageManager.onEthTxComplete(unconfirmedTx.txHash);
      })
      .on(EthereumAPIEvent.RadiusUpdated, async () => {
        const newRadius = await gameManager.ethereumAPI.getWorldRadius();
        gameManager.setRadius(newRadius);
      });

    const unconfirmedTxs = await localStorageManager.getUnconfirmedEthTxs();
    for (const unconfirmedTx of unconfirmedTxs) {
      // recommits the tx to storage but whatever
      gameManager.ethereumAPI.onTxSubmit(unconfirmedTx);
    }

    // we only want to initialize the mining manager if the player has already joined the game
    // if they haven't, we'll do this once the player has joined the game
    if (!!homeCoords && account in players) {
      gameManager.initMiningManager(homeCoords);
    }

    return gameManager;
  }

  public getAccount(): EthAddress | null {
    return this.account;
  }

  public getContractAddress(): EthAddress {
    return this.ethereumAPI.getContractAddress();
  }

  public getTwitter(address: EthAddress | null): string | null {
    let myAddress;
    if (!address) myAddress = this.getAccount();
    else myAddress = address;

    if (!myAddress) {
      return null;
    }
    const twitter = this.players[myAddress]?.twitter;
    return twitter || null;
  }

  public getEndTimeSeconds(): number {
    return this.endTimeSeconds;
  }

  public getDefaultSilver(planet: Planet): number {
    return this.contractConstants.defaultSilverCap[planet.planetLevel];
  }

  public getPopulationCurveAtPercent(planet: Planet, percent: number): number {
    return this.planetHelper.getPopulationCurveAtPercent(planet, percent);
  }

  public getSilverCurveAtPercent(
    planet: Planet,
    percent: number
  ): number | null {
    return this.planetHelper.getSilverCurveAtPercent(planet, percent);
  }

  public getUpgrade(branch: number, level: number): Upgrade {
    return this.contractConstants.upgrades[branch][level];
  }

  public getAllPlayers(): Player[] {
    return Object.values(this.players);
  }

  public getExploredChunks(): Iterable<ExploredChunkData> {
    return this.localStorageManager.allChunks();
  }

  public getWorldRadius(): number {
    return this.worldRadius;
  }

  public getWorldSilver(): number {
    return this.getAllOwnedPlanets().reduce(
      (totalSoFar: number, nextPlanet: Planet) =>
        totalSoFar + nextPlanet.silver,
      0
    );
  }

  public getWorldPop(): number {
    return this.getAllOwnedPlanets().reduce(
      (totalSoFar: number, nextPlanet: Planet) =>
        totalSoFar + nextPlanet.population,
      0
    );
  }

  public getSilverOfPlayer(player: EthAddress): number {
    return this.getAllOwnedPlanets()
      .filter((planet) => planet.owner === player)
      .reduce(
        (totalSoFar: number, nextPlanet: Planet) =>
          totalSoFar + nextPlanet.silver,
        0
      );
  }

  public getPopOfPlayer(player: EthAddress): number {
    return this.getAllOwnedPlanets()
      .filter((planet) => planet.owner === player)
      .reduce(
        (totalSoFar: number, nextPlanet: Planet) =>
          totalSoFar + nextPlanet.population,
        0
      );
  }

  private initMiningManager(homeCoords: WorldCoords): void {
    const myPattern: MiningPattern = new SpiralPattern(
      homeCoords,
      this.useMockHash ? MAX_CHUNK_SIZE : MIN_CHUNK_SIZE
    );

    this.minerManager = MinerManager.create(
      this.localStorageManager,
      myPattern,
      this.worldRadius,
      this.planetRarity,
      this.useMockHash
    );

    this.minerManager.on(
      MinerManagerEvent.DiscoveredNewChunk,
      (chunk: ExploredChunkData, miningTimeMillis: number) => {
        for (const planetLocation of chunk.planetLocations) {
          this.planetHelper.addPlanetLocation(planetLocation);
        }
        this.hashRate =
          chunk.chunkFootprint.sideLength ** 2 / (miningTimeMillis / 1000);
        this.emit(GameManagerEvent.DiscoveredNewChunk);
      }
    );
    this.minerManager.startExplore();
  }

  setMiningPattern(pattern: MiningPattern): void {
    if (this.minerManager) {
      this.minerManager.setMiningPattern(pattern);
    }
  }
  getMiningPattern(): MiningPattern | null {
    if (this.minerManager) return this.minerManager.getMiningPattern();
    else return null;
  }

  hasJoinedGame(): boolean {
    return (this.account as string) in this.players;
  }

  // can't just hash the coords and ask planetHelper since this needs to be fast
  // so we sort of use knownChunks as a cache
  // TODO: maybe we should memoize the planet hashes?
  getPlanetWithCoords(coords: WorldCoords): Planet | null {
    return this.planetHelper.getPlanetWithCoords(coords);
  }

  // returns an empty planet if planet is not in contract
  // returns null if this isn't a planet, according to hash and coords
  getPlanetWithLocation(location: Location): Planet | null {
    return this.planetHelper.getPlanetWithLocation(location);
  }

  // only returns planets in contract
  // if we don't know if a planet is in contract, query for it by
  // location.
  getPlanetWithId(planetId: LocationId): Planet | null {
    return this.planetHelper.getPlanetWithId(planetId);
  }

  // fast query that doesn't update planet if stale
  // returns null if planet is neither in contract nor known chunks
  getPlanetLevel(planetId: LocationId): PlanetLevel | null {
    return this.planetHelper.getPlanetLevel(planetId);
  }

  // fast query that doesn't update planet if stale
  // returns null if planet is neither in contract nor known chunks
  getPlanetDetailLevel(planetId: LocationId): number | null {
    return this.planetHelper.getPlanetDetailLevel(planetId);
  }

  getLocationOfPlanet(planetId: LocationId): Location | null {
    return this.planetHelper.getLocationOfPlanet(planetId);
  }

  getAllVoyages(): QueuedArrival[] {
    return this.planetHelper.getAllVoyages();
  }

  getAllOwnedPlanets(): Planet[] {
    return this.planetHelper.getAllOwnedPlanets();
  }

  getEnergyNow(): number {
    const {
      ENERGY_CAP: energyMax,
      ENERGY_PER_SECOND: energyPerSecond,
      timeFactorPercentage,
    } = this.contractConstants;
    if (!this.energyData) return energyMax; // shouldn't happen, but just in case

    let timeSec = Date.now() / 1000 - this.energyData.lastUpdated;
    timeSec = (timeSec * timeFactorPercentage) / 100;

    const delta = timeSec * energyPerSecond;
    return Math.min(energyMax, this.energyData.energy + delta);
  }

  getHashesPerSec(): number {
    return this.hashRate;
  }

  getSignedTwitter(twitter: string): Promise<string> {
    return this.ethereumAPI.signMessage(twitter);
  }

  getUnconfirmedMoves(): UnconfirmedMove[] {
    return this.planetHelper.getUnconfirmedMoves();
  }

  getUnconfirmedUpgrades(): UnconfirmedUpgrade[] {
    return this.planetHelper.getUnconfirmedUpgrades();
  }

  // can return undefined
  getHomeCoords(): WorldCoords | null {
    if (!this.homeCoords) return null;
    return {
      x: this.homeCoords.x,
      y: this.homeCoords.y,
    };
  }

  startExplore(): void {
    if (this.minerManager) {
      this.minerManager.startExplore();
    }
  }

  stopExplore(): void {
    if (this.minerManager) {
      this.hashRate = 0;
      this.minerManager.stopExplore();
    }
  }

  private setRadius(worldRadius: number) {
    this.worldRadius = worldRadius;

    if (this.minerManager) {
      this.minerManager.setRadius(this.worldRadius);
    }
  }

  private async refreshTwitters(): Promise<void> {
    // get twitter handles
    const addressTwitters = await getAllTwitters();
    for (const key of Object.keys(addressTwitters)) {
      const addr = address(key);
      if (this.players[addr]) {
        this.players[addr].twitter = addressTwitters[addr];
      }
    }
  }

  async verifyTwitter(twitter: string): Promise<boolean> {
    if (!this.account) return Promise.resolve(false);
    const success = await verifyTwitterHandle(twitter, this.account);
    await this.refreshTwitters();
    return success;
  }

  joinGame(): GameManager {
    if (Date.now() / 1000 > this.endTimeSeconds) {
      const terminalEmitter = TerminalEmitter.getInstance();
      terminalEmitter.println('[ERROR] Game has ended.');
      return this;
    }
    this.getRandomHomePlanetCoords().then(async (args) => {
      const [{ x, y }, p] = args;
      console.log('setting home coords.');
      console.log(x, y);
      const homeCoords = { x, y };
      addAccountToBrowser(this.ethereumAPI.getContractAddress());
      await this.localStorageManager.setHomeCoords(homeCoords); // set this before getting the call result, in case user exits before tx confirmed
      this.homeCoords = homeCoords;
      this.snarkHelper
        .getInitArgs(x, y, p, this.worldRadius)
        .then((callArgs) => {
          return this.ethereumAPI.initializePlayer(callArgs);
        })
        .then(async () => {
          this.initMiningManager(homeCoords);
          this.emit(GameManagerEvent.InitializedPlayer);
        })
        .catch((err) => {
          console.error(err); // Don't delete this.
          this.emit(GameManagerEvent.InitializedPlayerError, err); // Because this is fucked
        });
    });

    return this;
  }

  async addAccount(coords: WorldCoords): Promise<boolean> {
    const homePlanetId = locationIdFromBigInt(mimcHash(coords.x, coords.y));
    const planet = this.getPlanetWithId(homePlanetId);
    if (!planet || planet.owner !== this.account) {
      return Promise.resolve(false);
    }
    addAccountToBrowser(this.ethereumAPI.getContractAddress());
    await this.localStorageManager.setHomeCoords(coords);
    this.initMiningManager(coords);
    this.homeCoords = coords;
    return true;
  }

  private async getRandomHomePlanetCoords(
    iterations = 0
  ): Promise<[WorldCoords, number]> {
    const terminalEmitter = TerminalEmitter.getInstance();
    // technically its 100 but its fine lmao
    if (iterations % 20 === 0) {
      terminalEmitter.println('Hashed 2048 potential planets...');
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    }

    let count = 100;
    let validHomePlanet = false;
    let x;
    let y;
    let hash;
    let perlinValue;

    do {
      const t = Math.random() * 2 * Math.PI;
      const r = (0.5 + Math.random() * 0.5) * this.worldRadius;
      x = Math.floor(Math.cos(t) * r);
      y = Math.floor(Math.sin(t) * r);

      if (x ** 2 + y ** 2 >= this.worldRadius ** 2) continue;

      perlinValue = perlin({ x, y });

      if (this.planetHelper.perlinToSpace(perlinValue) === SpaceType.DeepSpace)
        continue;

      hash = this.useMockHash ? fakeHash(x, y) : mimcHash(x, y);
      const hexStr = locationIdFromBigInt(hash);
      const lv = this.planetHelper.planetLevelFromHexPerlin(
        hexStr,
        perlinValue
      );
      const planetType = this.planetHelper.planetTypeFromHexPerlin(
        hexStr,
        perlinValue
      );

      if (
        hash.lesser(LOCATION_ID_UB.divide(this.planetRarity)) &&
        lv === PlanetLevel.MIN &&
        planetType === PlanetType.PLANET
      ) {
        validHomePlanet = true;
      }

      count -= 1;
    } while (!validHomePlanet && count > 0);
    if (validHomePlanet) {
      return [{ x, y }, perlinValue];
    }
    return new Promise((resolve) => {
      setTimeout(async () => {
        const coords = await this.getRandomHomePlanetCoords(iterations + 1);
        resolve(coords);
      }, 0);
    });
  }

  move(from: Planet, to: Planet, forces: number, silver: number): GameManager {
    if (Date.now() / 1000 > this.endTimeSeconds) {
      const terminalEmitter = TerminalEmitter.getInstance();
      terminalEmitter.println('[ERROR] Game has ended.');
      return this;
    }
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.shell(
      `df move -from ${from.locationId} -to ${to.locationId} -f ${forces} -s ${silver}`
    );

    const oldLocation = this.planetHelper.getLocationOfPlanet(from.locationId);
    const newLocation = this.planetHelper.getLocationOfPlanet(to.locationId);
    if (!oldLocation) {
      console.error('tried to move from planet that does not exist');
      return this;
    }
    if (!newLocation) {
      console.error('tried to move from planet that does not exist');
      return this;
    }

    const oldX = oldLocation.coords.x;
    const oldY = oldLocation.coords.y;
    const newX = newLocation.coords.x;
    const newY = newLocation.coords.y;
    const xDiff = newX - oldX;
    const yDiff = newY - oldY;

    const distMax = Math.ceil(Math.sqrt(xDiff ** 2 + yDiff ** 2));

    const shipsMoved = forces;
    const silverMoved = silver;

    if (newX ** 2 + newY ** 2 >= this.worldRadius ** 2) {
      throw new Error('attempted to move out of bounds');
    }

    if (
      !this.account ||
      from.owner.toLowerCase() !== this.account.toLowerCase()
    ) {
      throw new Error('attempted to move from a planet not owned by player');
    }

    this.snarkHelper
      .getMoveArgs(
        oldX,
        oldY,
        newX,
        newY,
        newLocation.perlin,
        this.worldRadius,
        distMax
      )
      .then((callArgs) => {
        return this.ethereumAPI.move(callArgs, shipsMoved, silverMoved);
      })
      .then(() => {
        //no-op, delete?
        this.emit(GameManagerEvent.Moved);
      });
    return this;
  }

  upgrade(planet: Planet, branch: number): GameManager {
    if (Date.now() / 1000 > this.endTimeSeconds) {
      const terminalEmitter = TerminalEmitter.getInstance();
      terminalEmitter.println('[ERROR] Game has ended.');
      return this;
    }
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.shell(
      `df upgrade -on ${planet.locationId} -branch ${branch}`
    );

    const upgradeArgs: UpgradeArgs = [
      locationIdToBigNumber(planet.locationId).toString(),
      branch.toString(),
    ];

    this.ethereumAPI.upgradePlanet(upgradeArgs);
    return this;
  }
}

export default GameManager;
