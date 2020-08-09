import {
  PlanetMap,
  VoyageMap,
  PlanetVoyageIdMap,
  PlanetLocationMap,
  LocationId,
  Location,
  Planet,
  QueuedArrival,
  ArrivalWithTimer,
  VoyageContractData,
  Defaults,
  PlanetLevel,
  PlanetVariant,
  PlanetType,
  PlanetResource,
  SpaceType,
  ResourceData,
} from '../_types/global/GlobalTypes';
import {
  ContractConstants,
  UnconfirmedMove,
  UnconfirmedTx,
  UnconfirmedUpgrade,
} from '../_types/darkforest/api/EthereumAPITypes';
import bigInt from 'big-integer';
import _ from 'lodash';
import { WorldCoords } from '../utils/Coordinates';
import { emptyAddress } from '../utils/CheckedTypeUtils';
import { hasOwner, getBytesFromHex, bonusFromHex } from '../utils/Utils';
import LocalStorageManager from './LocalStorageManager';
import { isUnconfirmedMove, isUnconfirmedUpgrade } from './EthereumAPI';

interface MemoizedCoordHashes {
  [x: number]: { [y: number]: Location };
}

export class PlanetHelper {
  private readonly planets: PlanetMap;
  private readonly arrivals: VoyageMap;
  private readonly planetArrivalIds: PlanetVoyageIdMap;
  private readonly planetLocationMap: PlanetLocationMap;
  private readonly contractConstants: ContractConstants;
  private readonly coordsToLocation: MemoizedCoordHashes;
  private readonly unconfirmedMoves: Record<string, UnconfirmedMove>;
  private readonly unconfirmedUpgrades: Record<string, UnconfirmedUpgrade>;

  private readonly endTimeSeconds: number;

  private get timeFactorPercentage(): number {
    return this.contractConstants.timeFactorPercentage;
  }

  constructor(
    planets: PlanetMap,
    chunkStore: LocalStorageManager,
    unprocessedArrivals: VoyageContractData,
    unprocessedPlanetArrivalIds: PlanetVoyageIdMap,
    contractConstants: ContractConstants,
    endTimeSeconds: number
  ) {
    this.planets = planets;
    this.contractConstants = contractConstants;
    this.coordsToLocation = {};
    this.planetLocationMap = {};
    const planetArrivalIds: PlanetVoyageIdMap = {};
    const arrivals: VoyageMap = {};
    this.endTimeSeconds = endTimeSeconds;
    for (const planetId in planets) {
      if (planets.hasOwnProperty(planetId)) {
        const planet = planets[planetId];
        const arrivalsForPlanet = unprocessedPlanetArrivalIds[planetId]
          .map((arrivalId) => unprocessedArrivals[arrivalId] || null)
          .filter((x) => !!x);
        const arrivalsWithTimers = this.processArrivalsForPlanet(
          planet.locationId,
          arrivalsForPlanet
        );
        planetArrivalIds[planetId] = arrivalsWithTimers.map(
          (arrival) => arrival.arrivalData.eventId
        );
        for (const arrivalWithTimer of arrivalsWithTimers) {
          const arrivalId = arrivalWithTimer.arrivalData.eventId;
          arrivals[arrivalId] = arrivalWithTimer;
        }
        this.updateScore(planetId as LocationId);
      }
    }

    const allChunks = chunkStore.allChunks();
    for (const chunk of allChunks) {
      for (const planetLocation of chunk.planetLocations) {
        this.addPlanetLocation(planetLocation);
      }
    }

    this.arrivals = arrivals;
    this.planetArrivalIds = planetArrivalIds;
    this.unconfirmedMoves = {};
    this.unconfirmedUpgrades = {};

    // set interval to update all planets every 120s
    setInterval(() => {
      for (const planetId of Object.keys(this.planets)) {
        setTimeout(() => {
          const planet = this.planets[planetId];
          if (planet && hasOwner(planet)) {
            this.updatePlanetToTime(planet, Date.now());
          }
        }, Math.floor(120000 * Math.random())); // evenly distribute updates
      }
    }, 120000);
  }

  // only returns planets in contract
  public getPlanetWithId(planetId: LocationId): Planet | null {
    const planet = this.planets[planetId];
    if (planet) {
      this.updatePlanetIfStale(planet);
      return planet;
    }
    return null;
  }

  // returns null if this planet is neither in contract nor in known chunks
  // fast query that doesn't update planet if stale
  public getPlanetLevel(planetId: LocationId): PlanetLevel | null {
    const planet = this.planets[planetId];
    if (planet) {
      return planet.planetLevel;
    }
    return null;
  }

  // returns null if this planet is neither in contract nor in known chunks
  // fast query that doesn't update planet if stale
  public getPlanetDetailLevel(planetId: LocationId): number | null {
    const planet = this.planets[planetId];
    if (planet) {
      let detailLevel = planet.planetLevel;
      if (planet.planetType === PlanetType.TRADING_POST) {
        detailLevel += 10;
      }
      if (hasOwner(planet)) {
        detailLevel += 1;
      }
      return detailLevel;
    } else {
      return null;
    }
  }

  public refreshPlanetAndArrivals(
    planet: Planet,
    arrivals: QueuedArrival[]
  ): void {
    // does not modify unconfirmed departures or upgrades
    // that is handled by onTxConfirm
    if (this.planets[planet.locationId]) {
      const { unconfirmedDepartures, unconfirmedUpgrades } = this.planets[
        planet.locationId
      ];
      planet.unconfirmedDepartures = unconfirmedDepartures;
      planet.unconfirmedUpgrades = unconfirmedUpgrades;
    }
    this.planets[planet.locationId] = planet;
    this.clearOldArrivals(planet);
    const updatedAwts = this.processArrivalsForPlanet(
      planet.locationId,
      arrivals
    );
    for (const awt of updatedAwts) {
      const arrivalId = awt.arrivalData.eventId;
      this.arrivals[arrivalId] = awt;
      this.planetArrivalIds[planet.locationId].push(arrivalId);
    }
    this.updateScore(planet.locationId);
  }

  // returns an empty planet if planet is not in contract
  // returns null if this isn't a planet, according to hash and coords
  public getPlanetWithCoords(coords: WorldCoords): Planet | null {
    const { x, y } = coords;
    let location: Location | null = null;
    if (this.coordsToLocation[x] && this.coordsToLocation[x][y]) {
      location = this.coordsToLocation[x][y];
    }
    if (!location) {
      return null;
    }
    return this.getPlanetWithLocation(location);
  }

  // returns an empty planet if planet is not in contract
  // returns null if this isn't a planet, according to hash and coords
  public getPlanetWithLocation(location: Location): Planet | null {
    if (!!this.planets[location.hash]) {
      const planet = this.planets[location.hash];
      this.updatePlanetIfStale(planet);
      return this.planets[location.hash];
    }
    // return a default unowned planet
    const myPlanet = this.defaultPlanetFromLocation(location);

    this.planets[location.hash] = myPlanet;

    return myPlanet;
  }

  public addPlanetLocation(planetLocation: Location): void {
    this.planetLocationMap[planetLocation.hash] = planetLocation;
    const { x, y } = planetLocation.coords;
    if (!this.coordsToLocation[x]) this.coordsToLocation[x] = {};
    this.coordsToLocation[x][y] = planetLocation;
    if (!this.planets[planetLocation.hash]) {
      this.planets[planetLocation.hash] = this.defaultPlanetFromLocation(
        planetLocation
      );
    }
  }

  public getLocationOfPlanet(planetId: LocationId): Location | null {
    return this.planetLocationMap[planetId] || null;
  }

  public getAllOwnedPlanets(): Planet[] {
    return Object.values(this.planets).filter(hasOwner);
  }

  public getAllVoyages(): QueuedArrival[] {
    // there are not many voyages
    return Object.values(this.arrivals).map((awt) => awt.arrivalData);
  }

  public onTxSubmit(unconfirmedTx: UnconfirmedTx) {
    if (isUnconfirmedMove(unconfirmedTx)) {
      this.unconfirmedMoves[unconfirmedTx.txHash] = unconfirmedTx;
      const planet = this.getPlanetWithId(unconfirmedTx.from);
      if (planet) {
        planet.unconfirmedDepartures.push(unconfirmedTx);
      }
    } else if (isUnconfirmedUpgrade(unconfirmedTx)) {
      this.unconfirmedUpgrades[unconfirmedTx.txHash] = unconfirmedTx;
      const planet = this.getPlanetWithId(unconfirmedTx.locationId);
      if (planet) {
        planet.unconfirmedUpgrades.push(unconfirmedTx);
      }
    }
  }

  public onTxConfirm(unconfirmedTx: UnconfirmedTx) {
    if (isUnconfirmedMove(unconfirmedTx)) {
      const planet = this.getPlanetWithId(unconfirmedTx.from);
      if (planet) {
        let removeIdx = -1;
        for (let i = 0; i < planet.unconfirmedDepartures.length; i += 1) {
          if (planet.unconfirmedDepartures[i].txHash === unconfirmedTx.txHash) {
            removeIdx = i;
            break;
          }
        }
        if (removeIdx > -1) {
          planet.unconfirmedDepartures.splice(removeIdx, 1);
        }
      }
      delete this.unconfirmedMoves[unconfirmedTx.txHash];
    } else if (isUnconfirmedUpgrade(unconfirmedTx)) {
      const planet = this.getPlanetWithId(unconfirmedTx.locationId);
      if (planet) {
        let removeIdx = -1;
        for (let i = 0; i < planet.unconfirmedUpgrades.length; i += 1) {
          if (planet.unconfirmedUpgrades[i].txHash === unconfirmedTx.txHash) {
            removeIdx = i;
            break;
          }
        }
        if (removeIdx > -1) {
          planet.unconfirmedUpgrades.splice(removeIdx, 1);
        }
      }
      delete this.unconfirmedUpgrades[unconfirmedTx.txHash];
    }
  }

  public getUnconfirmedMoves(): UnconfirmedMove[] {
    return Object.values(this.unconfirmedMoves);
  }

  public getUnconfirmedUpgrades(): UnconfirmedUpgrade[] {
    return Object.values(this.unconfirmedUpgrades);
  }

  public perlinToSpace(perlin: number): SpaceType {
    if (perlin >= this.contractConstants.PERLIN_THRESHOLD) {
      return SpaceType.DeepSpace;
    } else return SpaceType.SafeSpace;
  }

  private arrive(
    fromPlanet: Planet,
    toPlanet: Planet,
    arrival: QueuedArrival
  ): void {
    // this function optimistically simulates an arrival

    // update toPlanet population and silver right before arrival
    this.updatePlanetToTime(toPlanet, arrival.arrivalTime * 1000);

    // apply population

    const { popArriving: shipsMoved } = arrival;

    if (arrival.player !== toPlanet.owner) {
      // attacking enemy - includes emptyAddress

      if (toPlanet.population > shipsMoved) {
        // attack reduces target planet's garrison but doesn't conquer it
        toPlanet.population -= shipsMoved;
      } else {
        // conquers planet
        toPlanet.owner = arrival.player;
        toPlanet.population = shipsMoved - toPlanet.population;
        this.updateScore(toPlanet.locationId);
      }
    } else {
      // moving between my own planets
      toPlanet.population += shipsMoved;
    }

    // apply silver
    if (toPlanet.silver + arrival.silverMoved > toPlanet.silverMax) {
      toPlanet.silver = toPlanet.silverMax;
    } else {
      toPlanet.silver += arrival.silverMoved;
    }
  }

  private processArrivalsForPlanet(
    planetId: LocationId,
    arrivals: QueuedArrival[]
  ): ArrivalWithTimer[] {
    // process the QueuedArrival[] for a single planet
    const arrivalsWithTimers: ArrivalWithTimer[] = [];

    // sort arrivals by timestamp
    arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime);
    const nowInSeconds = Date.now() / 1000;
    for (const arrival of arrivals) {
      try {
        if (
          nowInSeconds - arrival.arrivalTime > 0 &&
          this.planets[arrival.fromPlanet] &&
          this.planets[arrival.toPlanet]
        ) {
          // if arrival happened in the past, run this arrival
          this.arrive(
            this.planets[arrival.fromPlanet],
            this.planets[arrival.toPlanet],
            arrival
          );
        } else {
          // otherwise, set a timer to do this arrival in the future
          // and append it to arrivalsWithTimers
          const applyFutureArrival = setTimeout(() => {
            this.arrive(
              this.planets[arrival.fromPlanet],
              this.planets[arrival.toPlanet],
              arrival
            );
          }, arrival.arrivalTime * 1000 - Date.now());
          const arrivalWithTimer = {
            arrivalData: arrival,
            timer: applyFutureArrival,
          };
          arrivalsWithTimers.push(arrivalWithTimer);
        }
      } catch (e) {
        console.error(
          `error occurred processing arrival for updated planet ${planetId}: ${e}`
        );
      }
    }
    return arrivalsWithTimers;
  }

  private clearOldArrivals(planet: Planet): void {
    const planetId = planet.locationId;
    // clear old timeouts
    if (this.planetArrivalIds[planetId]) {
      // clear if the planet already had stored arrivals
      for (const arrivalId of this.planetArrivalIds[planetId]) {
        const arrivalWithTimer = this.arrivals[arrivalId];
        if (arrivalWithTimer) {
          clearTimeout(arrivalWithTimer.timer);
        } else {
          console.error(`arrival with id ${arrivalId} wasn't found`);
        }
        delete this.arrivals[arrivalId];
      }
    }
    this.planetArrivalIds[planetId] = [];
  }

  private updatePlanetToTime(planet: Planet, atTimeMillis: number): void {
    const safeEndMillis = Math.min(atTimeMillis, this.endTimeSeconds * 1000);
    if (safeEndMillis < planet.lastUpdated * 1000) {
      // console.error('tried to update planet to a past time');
      return;
    }
    const oldPop = planet.population;
    const newPop = this.getPopulationAtTime(planet, safeEndMillis);
    if (newPop < planet.populationCap / 2) {
      // no silver mined
    } else if (oldPop > planet.populationCap / 2) {
      // silver was mining the whole time
      const startTimeMillis = planet.lastUpdated * 1000;
      planet.silver = this.getSilverOverTime(
        planet,
        startTimeMillis,
        safeEndMillis
      );
    } else {
      // find the point where silver started being mined
      const startTimeMillis = this.getPopulationCurveMidpoint(planet) * 1000;
      planet.silver = this.getSilverOverTime(
        planet,
        startTimeMillis,
        safeEndMillis
      );
    }
    planet.population = newPop;
    planet.lastUpdated = safeEndMillis / 1000;
  }

  // we can make 'hex' a locationId as opposed to a string, since that's what it is internally

  // no-op
  private planetVariantFromHex(hex: LocationId): PlanetVariant {
    const _varByte = getBytesFromHex(hex, 9, 10);

    const ret = PlanetVariant.MIN;
    return ret;
  }

  public planetTypeFromHexPerlin(hex: LocationId, perlin: number): PlanetType {
    return PlanetType.PLANET;

    const { TRADING_POST_RARITY: tradingPostRarity } = this.contractConstants;
    const typeBytes = Number(getBytesFromHex(hex, 7, 9));

    let ret = PlanetType.PLANET;
    if (
      bigInt(typeBytes * tradingPostRarity).lesser(65536) &&
      this.perlinToSpace(perlin) === SpaceType.DeepSpace
    ) {
      ret = PlanetType.TRADING_POST;
    }

    return ret;
  }

  public planetLevelFromHexPerlin(
    hex: LocationId,
    _perlin: number
  ): PlanetLevel {
    const { planetLevelThresholds: planetLevelFreq } = this.contractConstants;

    const levelBigInt = getBytesFromHex(hex, 4, 7);

    let ret = PlanetLevel.MIN;

    for (let type = PlanetLevel.MAX; type >= PlanetLevel.MIN; type--) {
      if (levelBigInt < bigInt(planetLevelFreq[type])) {
        ret = type;
        break;
      }
    }

    /* 
    if (
      this.perlinToSpace(perlin) === SpaceType.SafeSpace &&
      ret > PlanetLevel.YellowStar
    ) {
      ret = PlanetLevel.YellowStar;
    }
    */

    return ret;
  }

  private defaultResourceDataFromHexPerlin(
    hex: LocationId,
    perlin: number
  ): ResourceData {
    const {
      defaultPopulationCap,
      defaultPopulationGrowth,
      defaultSilverCap,
      defaultSilverGrowth,
      defaultRange,
      SILVER_RARITY: silverRarity,
    } = this.contractConstants;

    const planetLevel = this.planetLevelFromHexPerlin(hex, perlin);
    const planetType = this.planetTypeFromHexPerlin(hex, perlin);

    let resType = PlanetResource.NONE;
    const silverByte = Number(getBytesFromHex(hex, 10, 11));

    if (bigInt(silverByte * silverRarity).lesser(256)) {
      resType = PlanetResource.SILVER;
    }

    // calculate default stats
    let myLevel = planetLevel;
    if (planetType === PlanetType.TRADING_POST) {
      myLevel = PlanetLevel.YellowStar;
    }

    let popCap = defaultPopulationCap[myLevel];
    let popGro = defaultPopulationGrowth[myLevel];

    let silCap = defaultSilverCap[myLevel];
    let silGro = defaultSilverGrowth[myLevel];

    let range = defaultRange[myLevel];

    if (
      planetType !== PlanetType.TRADING_POST &&
      this.perlinToSpace(perlin) === SpaceType.DeepSpace
    ) {
      popCap = Math.floor(popCap * 1.5);
      popGro = Math.floor(popGro * 1.5);
      silCap = Math.floor(silCap * 1.5);
      silGro = Math.floor(silGro * 1.5);
      range = Math.floor(range * 1.5);
    }

    // also, this case
    if (silGro === 0) {
      resType = PlanetResource.NONE;
    }

    const defaults: Defaults = [popCap, popGro, silCap, silGro, range];

    return {
      stats: defaults,
      resourceType: resType,
    };
  }

  private defaultBarbariansFromHexPerlin(
    hex: LocationId,
    perlin: number
  ): number {
    const {
      TRADING_POST_BARBARIANS: tradingPostBarbarians,
      defaultBarbarianPercentage: defaultBarbarians,
    } = this.contractConstants;
    const type = this.planetTypeFromHexPerlin(hex, perlin);
    const level = this.planetLevelFromHexPerlin(hex, perlin);

    if (type === PlanetType.TRADING_POST) return tradingPostBarbarians;
    else return defaultBarbarians[level];
  }

  // imitates contract newPlanet, but doesn't take population (currently never needs to)
  private defaultPlanetFromLocation(location: Location): Planet {
    const { defaultSilverMax: defaultMaxSilver } = this.contractConstants;
    const { perlin } = location;
    const hex = location.hash;

    const planetLevel = this.planetLevelFromHexPerlin(hex, perlin);
    const planetType = this.planetTypeFromHexPerlin(hex, perlin);

    const resourceData = this.defaultResourceDataFromHexPerlin(hex, perlin);
    const defaults = resourceData.stats;
    const planetResource = resourceData.resourceType;

    let [popCap, popGro, resCap, resGro, range] = defaults;

    if (planetResource === PlanetResource.NONE) {
      resGro = 0;
    }

    const [
      popCapBonus,
      popGroBonus,
      resCapBonus,
      resGroBonus,
      rangeBonus,
    ] = bonusFromHex(hex);

    popCap *= popCapBonus ? 2 : 1;
    popGro *= popGroBonus ? 2 : 1;
    resGro *= resGroBonus ? 2 : 1;
    resCap *= resCapBonus ? 2 : 1;
    range *= rangeBonus ? 2 : 1;

    const silverMax = defaultMaxSilver[planetLevel];

    const defaultBarb = this.defaultBarbariansFromHexPerlin(hex, perlin);
    const barbarians = (popCap * defaultBarb) / 100;

    return {
      locationId: hex,
      owner: emptyAddress,

      planetLevel,
      planetType,
      planetResource, // None or Silver

      populationCap: popCap,
      populationGrowth: popGro,

      silverCap: resCap,
      silverGrowth: resGro,

      range,

      silverMax,

      population: barbarians,
      silver: 0,

      lastUpdated: Math.floor(Date.now() / 1000),

      upgradeState: [0, 0, 0],

      unconfirmedDepartures: [],
      unconfirmedUpgrades: [],
      silverSpent: 0,
    };
  }

  private updatePlanetIfStale(planet: Planet): void {
    const now = Date.now();
    if (now / 1000 - planet.lastUpdated > 1) {
      this.updatePlanetToTime(planet, now);
    }
  }

  private getPopulationAtTime(planet: Planet, atTimeMillis: number): number {
    if (planet.population === 0) {
      return 0;
    }
    if (!hasOwner(planet)) {
      return planet.population;
    }
    const timeElapsed =
      (atTimeMillis / 1000 - planet.lastUpdated) *
      (this.timeFactorPercentage / 100);
    const denominator =
      Math.exp(
        (-4 * planet.populationGrowth * timeElapsed) / planet.populationCap
      ) *
        (planet.populationCap / planet.population - 1) +
      1;
    return planet.populationCap / denominator;
  }

  private getPopulationCurveMidpoint(planet: Planet): number {
    // returns timestamp in seconds
    return this.getPopulationCurveAtPercent(planet, 50);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getPopulationCurveAtPercent(planet: Planet, percent: number): number {
    // returns timestamp (seconds) that planet will reach percent% of popcap
    // time may be in the past
    const p1 = (percent / 100) * planet.populationCap;
    const c = planet.populationCap;
    const p0 = planet.population;
    const g = planet.populationGrowth;
    const t0 = planet.lastUpdated;

    const t1 = (c / (4 * g)) * Math.log((p1 * (c - p0)) / (p0 * (c - p1))) + t0;

    return t1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getSilverCurveAtPercent(
    planet: Planet,
    percent: number
  ): number | null {
    // returns timestamp (seconds) that planet will reach percent% of silcap
    // if doesn't produce silver, returns null
    // if already over percent% of silcap, returns null
    if (
      planet.silverGrowth === 0 ||
      planet.planetResource === PlanetResource.NONE
    ) {
      return null;
    }
    const silverTarget = (percent / 100) * planet.silverCap;
    const silverDiff = silverTarget - planet.silver;
    if (silverDiff <= 0) {
      return null;
    }
    let timeToTarget = 0;
    if (planet.population < planet.populationCap / 2) {
      timeToTarget +=
        this.getPopulationCurveAtPercent(planet, 50) - planet.lastUpdated;
    }
    // console.log(silverDiff, planet.silverGrowth);
    timeToTarget += silverDiff / planet.silverGrowth;
    return planet.lastUpdated + timeToTarget;
  }

  private getSilverOverTime(
    planet: Planet,
    startTimeMillis: number,
    endTimeMillis: number
  ): number {
    if (!hasOwner(planet)) {
      return 0;
    }
    const silverGrowth =
      planet.planetResource === PlanetResource.SILVER ? planet.silverGrowth : 0;
    const silverCap =
      planet.planetResource === PlanetResource.SILVER ? planet.silverCap : 0;

    if (planet.silver > planet.silverMax) {
      console.error('hey u hacked something (silver > silverMax)');
      return (planet.silver = planet.silverMax);
    }
    if (planet.silver > silverCap) {
      return planet.silver;
    }
    const timeElapsed =
      (endTimeMillis / 1000 - startTimeMillis / 1000) *
      (this.timeFactorPercentage / 100);

    return Math.min(timeElapsed * silverGrowth + planet.silver, silverCap);
  }

  private calculateSilverSpent(planet: Planet): number {
    const upgradeFactor = this.contractConstants.defaultSilverCap[
      planet.planetLevel
    ];
    let silverSpent = 0;
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < planet.upgradeState[i]; j += 1) {
        silverSpent +=
          (this.contractConstants.upgrades[i][j].silverCapMultiplier / 100) *
          upgradeFactor;
      }
    }
    return silverSpent;
  }

  private updateScore(planetId: LocationId) {
    const planet = this.planets[planetId];
    if (!planet) {
      return;
    }
    planet.silverSpent = this.calculateSilverSpent(planet);
  }
}
