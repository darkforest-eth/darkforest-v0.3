import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { WorldCoords } from '../../utils/Coordinates';
import {
  Planet,
  Location,
  LocationId,
  ExploredChunkData,
  QueuedArrival,
  PlanetLevel,
  Player,
  EthAddress,
  Upgrade,
} from '../../_types/global/GlobalTypes';
import autoBind from 'auto-bind';
import { EventEmitter } from 'events';
import AbstractUIManager from './AbstractUIManager';
import AbstractGameManager from '../../api/AbstractGameManager';
import perlin from '../../miner/perlin';
import { moveShipsDecay } from '../../utils/Utils';
import {
  UnconfirmedMove,
  UnconfirmedUpgrade,
} from '../../_types/darkforest/api/EthereumAPITypes';
import { MiningPattern } from '../../utils/MiningPatterns';
import { GameManagerEvent } from '../../api/GameManager';

export enum GameUIManagerEvent {
  InitializedPlayer = 'InitializedPlayer',
  InitializedPlayerError = 'InitializedPlayerError',
  EnergyUpdate = 'EnergyUpdate',
}

class GameUIManager extends EventEmitter implements AbstractUIManager {
  private gameManager: AbstractGameManager;
  private replayMode: boolean;
  private detailLevel: number; // 0 is show everything; higher means show less
  private readonly radiusMap = {};

  private selectedPlanet: Planet | null = null;
  private selectedCoords: WorldCoords | null = null;
  private mouseDownOverPlanet: Planet | null = null;
  private mouseDownOverCoords: WorldCoords | null = null;
  private mouseHoveringOverPlanet: Planet | null = null;
  private mouseHoveringOverCoords: WorldCoords | null = null;

  private forcesSending: Record<LocationId, number> = {}; // this is a percentage
  private silverSending: Record<LocationId, number> = {}; // this is a percentage

  // lifecycle methods

  private constructor(gameManager: AbstractGameManager, replayMode = false) {
    super();

    this.gameManager = gameManager;
    this.replayMode = replayMode;
    if (this.replayMode) this.stopExplore();

    // this.radiusMap[PlanetType.LittleAsteroid] = 1;
    this.radiusMap[PlanetLevel.Asteroid] = 1;
    this.radiusMap[PlanetLevel.BrownDwarf] = 3;
    this.radiusMap[PlanetLevel.RedDwarf] = 9;
    this.radiusMap[PlanetLevel.WhiteDwarf] = 27;
    this.radiusMap[PlanetLevel.YellowStar] = 54;
    this.radiusMap[PlanetLevel.BlueStar] = 72;
    this.radiusMap[PlanetLevel.Giant] = 81;
    this.radiusMap[PlanetLevel.Supergiant] = 90;
    // this.radiusMap[PlanetType.SuperGiant] = 75;
    // this.radiusMap[PlanetType.HyperGiant] = 100;

    autoBind(this);
  }

  static create(gameManager: AbstractGameManager) {
    const uiEmitter = UIEmitter.getInstance();

    const uiManager = new GameUIManager(
      gameManager,
      false // GameManager instanceof ReplayerManager
    );

    uiEmitter.on(UIEmitterEvent.WorldMouseDown, uiManager.onMouseDown);
    uiEmitter.on(UIEmitterEvent.WorldMouseMove, uiManager.onMouseMove);
    uiEmitter.on(UIEmitterEvent.WorldMouseUp, uiManager.onMouseUp);
    uiEmitter.on(UIEmitterEvent.WorldMouseOut, uiManager.onMouseOut);

    gameManager.on(GameManagerEvent.PlanetUpdate, uiManager.updatePlanets);
    gameManager.on(GameManagerEvent.EnergyUpdate, uiManager.emitUpdateEnergy);

    return uiManager;
  }

  destroy(): void {
    const uiEmitter = UIEmitter.getInstance();

    uiEmitter.removeListener(UIEmitterEvent.WorldMouseDown, this.onMouseDown);
    uiEmitter.removeListener(UIEmitterEvent.WorldMouseMove, this.onMouseMove);
    uiEmitter.removeListener(UIEmitterEvent.WorldMouseUp, this.onMouseUp);
    uiEmitter.removeListener(UIEmitterEvent.WorldMouseOut, this.onMouseOut);

    this.gameManager.removeListener(
      GameManagerEvent.PlanetUpdate,
      this.updatePlanets
    );
    this.gameManager.removeListener(
      GameManagerEvent.EnergyUpdate,
      this.emitUpdateEnergy
    );
    this.gameManager.removeListener(
      GameManagerEvent.InitializedPlayer,
      this.onEmitInitializedPlayer
    );
    this.gameManager.removeListener(
      GameManagerEvent.InitializedPlayerError,
      this.onEmitInitializedPlayerError
    );

    this.gameManager.destroy();
  }

  // actions

  onJoinGameClicked(): GameUIManager {
    this.gameManager
      .joinGame()
      .once(GameManagerEvent.InitializedPlayer, this.onEmitInitializedPlayer)
      .once(
        GameManagerEvent.InitializedPlayerError,
        this.onEmitInitializedPlayerError
      );

    return this;
  }

  addAccount(coords: WorldCoords): Promise<boolean> {
    return this.gameManager.addAccount(coords);
  }

  verifyTwitter(twitter: string): Promise<boolean> {
    return this.gameManager.verifyTwitter(twitter);
  }

  onMouseDown(coords: WorldCoords) {
    const hoveringOverCoords = this.updateMouseHoveringOverCoords(coords);

    this.mouseDownOverPlanet = this.gameManager.getPlanetWithCoords(
      hoveringOverCoords
    );
    this.mouseDownOverCoords = this.mouseHoveringOverCoords;
  }

  onMouseMove(coords: WorldCoords) {
    this.updateMouseHoveringOverCoords(coords);
  }

  onMouseUp(coords: WorldCoords) {
    const mouseUpOverCoords = this.updateMouseHoveringOverCoords(coords);
    const mouseUpOverPlanet = this.gameManager.getPlanetWithCoords(
      mouseUpOverCoords
    );
    if (mouseUpOverPlanet) {
      if (
        this.mouseDownOverPlanet &&
        mouseUpOverPlanet.locationId === this.mouseDownOverPlanet.locationId
      ) {
        // toggle select
        if (
          this.selectedPlanet &&
          this.selectedPlanet.locationId === mouseUpOverPlanet.locationId
        ) {
          this.setSelectedPlanet(null);
          this.selectedCoords = null;
        } else {
          this.setSelectedPlanet(mouseUpOverPlanet);
          this.selectedCoords = mouseUpOverCoords;
          console.log(this.selectedPlanet);
          console.log(
            perlin({
              x: this.selectedCoords.x,
              y: this.selectedCoords.y,
            })
          );
        }
      } else if (
        !this.replayMode &&
        this.mouseDownOverPlanet &&
        this.mouseDownOverCoords &&
        this.mouseDownOverPlanet.owner === this.gameManager.getAccount()
      ) {
        // move initiated if enough forces
        const from = this.mouseDownOverPlanet;
        const to = mouseUpOverPlanet;
        let effectivePopulation = from.population;
        for (const unconfirmedMove of from.unconfirmedDepartures) {
          effectivePopulation -= unconfirmedMove.forces;
        }
        let forces = Math.floor(
          (effectivePopulation * this.getForcesSending(from.locationId)) / 100
        );

        // make it so you leave one force behind
        if (forces >= from.population) {
          forces = from.population - 1;
          if (forces < 1) return;
        }

        const dist = Math.sqrt(
          (this.mouseDownOverCoords.x - mouseUpOverCoords.x) ** 2 +
            (this.mouseDownOverCoords.y - mouseUpOverCoords.y) ** 2
        );
        const myAtk: number = moveShipsDecay(
          forces,
          this.mouseDownOverPlanet,
          dist
        );
        if (myAtk > 0) {
          this.gameManager.move(
            from,
            to,
            forces,
            Math.floor(
              (from.silver * this.getSilverSending(from.locationId)) / 100
            )
          );
        }
      }
    }

    this.mouseDownOverPlanet = null;
    this.mouseDownOverCoords = null;
  }

  onMouseOut() {
    this.mouseDownOverPlanet = null;
    this.mouseDownOverCoords = null;
    this.mouseHoveringOverPlanet = null;
    this.mouseHoveringOverCoords = null;
  }

  startExplore() {
    this.gameManager.startExplore();
  }

  stopExplore() {
    this.gameManager.stopExplore();
  }

  setForcesSending(planetId: LocationId, percentage: number) {
    this.forcesSending[planetId] = percentage;
  }

  setSilverSending(planetId: LocationId, percentage: number) {
    this.silverSending[planetId] = percentage;
  }

  isOwnedByMe(planet: Planet): boolean {
    return planet.owner === this.gameManager.getAccount();
  }

  setDetailLevel(level: number) {
    this.detailLevel = level;
  }

  // mining stuff
  setMiningPattern(pattern: MiningPattern) {
    this.gameManager.setMiningPattern(pattern);
  }
  getMiningPattern(): MiningPattern | null {
    return this.gameManager.getMiningPattern();
  }

  // getters

  getAccount(): EthAddress | null {
    return this.gameManager.getAccount();
  }

  getTwitter(address: EthAddress | null): string | null {
    return this.gameManager.getTwitter(address);
  }

  getEndTimeSeconds(): number {
    return this.gameManager.getEndTimeSeconds();
  }

  getUpgrade(branch: number, level: number): Upgrade {
    return this.gameManager.getUpgrade(branch, level);
  }

  getAllPlayers(): Player[] {
    return this.gameManager.getAllPlayers();
  }

  getDetailLevel(): number {
    return this.detailLevel;
  }

  getSelectedPlanet(): Planet | null {
    return this.selectedPlanet;
  }

  setSelectedPlanet(planet: Planet | null): void {
    const uiEmitter = UIEmitter.getInstance();
    this.selectedPlanet = planet;
    if (!planet) {
      this.selectedCoords = null;
    } else {
      const loc = this.getLocationOfPlanet(planet.locationId);
      if (!loc) this.selectedCoords = null;
      else this.selectedCoords = loc.coords;
    }
    uiEmitter.emit(UIEmitterEvent.GamePlanetSelected);
  }

  getSelectedCoords(): WorldCoords | null {
    return this.selectedCoords;
  }

  getMouseDownPlanet(): Planet | null {
    return this.mouseDownOverPlanet;
  }

  getMouseDownCoords(): WorldCoords | null {
    return this.mouseDownOverCoords;
  }

  getHoveringOverPlanet(): Planet | null {
    return this.mouseHoveringOverPlanet;
  }

  getHoveringOverCoords(): WorldCoords | null {
    return this.mouseHoveringOverCoords;
  }

  getForcesSending(planetId: LocationId): number {
    return this.forcesSending[planetId] || 50;
  }

  getSilverSending(planetId: LocationId): number {
    return this.silverSending[planetId] || 0;
  }

  isOverOwnPlanet(coords: WorldCoords): Planet | null {
    if (this.replayMode) {
      return null;
    }
    const res = this.planetHitboxForCoords(coords);
    let planet: Planet | null = null;
    if (res) {
      planet = res[0];
    }
    if (!planet) {
      return null;
    }
    return planet.owner === this.gameManager.getAccount() ? planet : null;
  }

  getPlanetWithId(planetId: LocationId): Planet | null {
    return this.gameManager.getPlanetWithId(planetId);
  }

  getPlanetWithLocation(location: Location): Planet | null {
    return this.gameManager.getPlanetWithLocation(location);
  }

  getPlanetLevel(planetId: LocationId): PlanetLevel | null {
    return this.gameManager.getPlanetLevel(planetId);
  }

  getPlanetDetailLevel(planetId: LocationId): number | null {
    return this.gameManager.getPlanetDetailLevel(planetId);
  }

  getAllOwnedPlanets(): Planet[] {
    return this.gameManager.getAllOwnedPlanets();
  }

  getAllVoyages(): QueuedArrival[] {
    return this.gameManager.getAllVoyages();
  }

  getUnconfirmedMoves(): UnconfirmedMove[] {
    return this.gameManager.getUnconfirmedMoves();
  }

  getUnconfirmedUpgrades(): UnconfirmedUpgrade[] {
    return this.gameManager.getUnconfirmedUpgrades();
  }

  getLocationOfPlanet(planetId: LocationId): Location | null {
    return this.gameManager.getLocationOfPlanet(planetId);
  }

  getExploredChunks(): Iterable<ExploredChunkData> {
    return this.gameManager.getExploredChunks();
  }

  getWorldRadius(): number {
    return this.gameManager.getWorldRadius();
  }

  getWorldSilver(): number {
    return this.gameManager.getWorldSilver();
  }

  getWorldPop(): number {
    return this.gameManager.getWorldPop();
  }

  getSilverOfPlayer(player: EthAddress): number {
    return this.gameManager.getSilverOfPlayer(player);
  }

  getPopOfPlayer(player: EthAddress): number {
    return this.gameManager.getPopOfPlayer(player);
  }

  getEnergy(): number {
    return 0;
    // return this.gameManager.getEnergyNow();
  }

  upgrade(planet: Planet, branch: number): void {
    this.gameManager.upgrade(planet, branch);
  }

  // non-nullable
  getHomeCoords(): WorldCoords {
    return this.gameManager.getHomeCoords() || { x: 0, y: 0 };
  }

  getRadiusOfPlanetLevel(planetRarity: PlanetLevel): number {
    return this.radiusMap[planetRarity];
  }

  getDefaultSilver(planet: Planet): number {
    return this.gameManager.getDefaultSilver(planet);
  }

  getPopulationCurveAtPercent(planet: Planet, percent: number): number {
    return this.gameManager.getPopulationCurveAtPercent(planet, percent);
  }

  getSilverCurveAtPercent(planet: Planet, percent: number): number | null {
    return this.gameManager.getSilverCurveAtPercent(planet, percent);
  }

  getHashesPerSec(): number {
    return this.gameManager.getHashesPerSec();
  }

  generateVerificationTweet(twitter: string): Promise<string> {
    return this.gameManager.getSignedTwitter(twitter);
  }

  // internal utils

  private updatePlanets() {
    if (this.selectedPlanet) {
      this.selectedPlanet = this.gameManager.getPlanetWithId(
        this.selectedPlanet.locationId
      );
    }
    if (this.mouseDownOverPlanet) {
      this.mouseDownOverPlanet = this.gameManager.getPlanetWithId(
        this.mouseDownOverPlanet.locationId
      );
    }
    if (this.mouseHoveringOverPlanet) {
      this.mouseHoveringOverPlanet = this.gameManager.getPlanetWithId(
        this.mouseHoveringOverPlanet.locationId
      );
    }
  }

  private emitUpdateEnergy() {
    // this is where we would update an internal energy value if we had one
    this.emit(GameUIManagerEvent.EnergyUpdate, this.getEnergy());
  }

  private updateMouseHoveringOverCoords(coords: WorldCoords): WorldCoords {
    // if the mouse is inside hitbox of a planet, snaps the mouse to center of planet
    this.mouseHoveringOverCoords = coords;
    this.mouseHoveringOverPlanet = null;

    const res = this.planetHitboxForCoords(coords);
    if (res) {
      this.mouseHoveringOverPlanet = res[0];
      this.mouseHoveringOverCoords = res[1];
    }

    this.mouseHoveringOverCoords = {
      x: Math.round(this.mouseHoveringOverCoords.x),
      y: Math.round(this.mouseHoveringOverCoords.y),
    };
    return this.mouseHoveringOverCoords;
  }

  private planetHitboxForCoords(
    coords: WorldCoords
  ): [Planet, WorldCoords] | null {
    const maxRadius = this.radiusMap[PlanetLevel.MAX];
    let planetInHitbox: Planet | null = null;
    let smallestPlanetRadius: number = maxRadius + 1;
    let planetCoords: WorldCoords | null = null;

    for (let dx = -1 * maxRadius; dx < maxRadius + 1; dx += 1) {
      for (let dy = -1 * maxRadius; dy < maxRadius + 1; dy += 1) {
        const x = Math.round(coords.x) + dx;
        const y = Math.round(coords.y) + dy;
        const planet = this.gameManager.getPlanetWithCoords({ x, y });
        if (
          planet &&
          this.radiusMap[planet.planetLevel] >
            Math.max(Math.abs(x - coords.x), Math.abs(y - coords.y))
        ) {
          // coords is in hitbox
          if (this.radiusMap[planet.planetLevel] < smallestPlanetRadius) {
            // we want the smallest planet that we're in the hitbox of
            planetInHitbox = planet;
            smallestPlanetRadius = this.radiusMap[planet.planetLevel];
            planetCoords = { x, y };
          }
        }
      }
    }

    if (planetCoords && planetInHitbox) {
      return [planetInHitbox, planetCoords];
    }
    return null;
  }

  private onEmitInitializedPlayer() {
    this.emit(GameUIManagerEvent.InitializedPlayer);
  }

  private onEmitInitializedPlayerError(err) {
    this.emit(GameUIManagerEvent.InitializedPlayerError, err);
  }
}

export default GameUIManager;
