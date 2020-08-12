//import * as EventEmitter from 'events';
import { EventEmitter } from 'events';
import {
  EthAddress,
  PlanetMap,
  Player,
  PlayerMap,
  QueuedArrival,
  Planet,
  Upgrade,
} from '../_types/global/GlobalTypes';
// NOTE: DO NOT IMPORT FROM ETHERS SUBPATHS. see https://github.com/ethers-io/ethers.js/issues/349 (these imports trip up webpack)
// in particular, the below is bad!
// import {TransactionReceipt, Provider, TransactionResponse, Web3Provider} from "ethers/providers";
import { Contract, providers, utils, BigNumber as EthersBN } from 'ethers';
import _ from 'lodash';

import {
  address,
  locationIdFromDecStr,
  locationIdToDecStr,
  locationIdToBigNumber,
} from '../utils/CheckedTypeUtils';
import {
  ContractConstants,
  InitializePlayerArgs,
  MoveArgs,
  RawPlanetData,
  RawPlanetExtendedInfo,
  UnconfirmedTx,
  UnconfirmedInit,
  EthTxType,
  UnconfirmedMove,
  ZKArgIdx,
  InitArgIdxs,
  MoveArgIdxs,
  ContractEvent,
  EthereumAPIEvent,
  MoveSnarkArgs,
  RawDefaults,
  RawArrivalData,
  UpgradeArgs,
  RawUpgradesInfo,
  UpgradesInfo,
  RawUpgrade,
  UnconfirmedUpgrade,
  UpgradeArgIdxs,
} from '../_types/darkforest/api/EthereumAPITypes';
import {
  AbstractContract,
  AbstractSigner,
  AbstractProvider,
} from './AbtractContract';
import { MockContract, MockSigner, MockProvider } from './MockContract';
import {
  getAddress as getMyAddress,
  getProvider,
} from '../utils/EthereumUtils';
import { aggregateBulkGetter, hexifyBigIntNestedArray } from '../utils/Utils';
import TerminalEmitter, { TerminalTextStyle } from '../utils/TerminalEmitter';

export function isUnconfirmedInit(tx: UnconfirmedTx): tx is UnconfirmedInit {
  return tx.type === EthTxType.INIT;
}

export function isUnconfirmedMove(tx: UnconfirmedTx): tx is UnconfirmedMove {
  return tx.type === EthTxType.MOVE;
}

export function isUnconfirmedUpgrade(
  tx: UnconfirmedTx
): tx is UnconfirmedUpgrade {
  return tx.type === EthTxType.UPGRADE;
}

export const contractPrecision = 1000;

// singleton class for managing all ethereum network calls
class EthereumAPI extends EventEmitter {
  readonly account: EthAddress;
  private readonly signer: AbstractSigner;
  private readonly provider: AbstractProvider;
  private readonly contract: AbstractContract;
  private readonly usingMockchain: boolean;

  private constructor(
    signer: AbstractSigner,
    provider: AbstractProvider,
    account: EthAddress,
    contract: AbstractContract,
    usingMockchain: boolean
  ) {
    super();
    this.signer = signer;
    this.provider = provider;
    this.account = account;
    this.contract = contract;
    this.usingMockchain = usingMockchain;
  }

  static async createMock(serverURL: string): Promise<EthereumAPI> {
    const playerAddress = address(await getMyAddress());
    const account: EthAddress = playerAddress as EthAddress;
    const signer = new MockSigner(account);
    const provider = new MockProvider(serverURL);

    const contract: AbstractContract = new MockContract(
      playerAddress,
      serverURL
    );

    const ethereumAPI: EthereumAPI = new EthereumAPI(
      signer,
      provider,
      account,
      contract,
      true
    );
    ethereumAPI.setupEventListeners();

    return ethereumAPI;
  }

  static async create(): Promise<EthereumAPI> {
    const contractABI = (
      await fetch('/public/contracts/DarkForestCore.json').then((x) => x.json())
    ).abi;

    const provider: providers.Web3Provider = await getProvider();
    const signer: providers.JsonRpcSigner = provider.getSigner();
    const account: EthAddress = address(await signer.getAddress());

    const isProd = process.env.NODE_ENV === 'production';
    const contractAddress = isProd
      ? require('../utils/prod_contract_addr').contractAddress
      : require('../utils/local_contract_addr').contractAddress;

    const contract: AbstractContract = new Contract(
      contractAddress,
      contractABI,
      signer
    );
    console.log('Core contract address is ', contractAddress);

    const ethereumAPI: EthereumAPI = new EthereumAPI(
      signer,
      provider,
      account,
      contract,
      false
    );
    ethereumAPI.setupEventListeners();

    return ethereumAPI;
  }

  destroy(): void {
    this.removeEventListeners();
  }

  private setupEventListeners(): void {
    this.contract
      .on(ContractEvent.PlayerInitialized, async (player, locRaw) => {
        const newPlayer: Player = { address: address(player) };
        this.emit(EthereumAPIEvent.PlayerInit, newPlayer);

        const newPlanet: Planet = await this.getPlanet(locRaw);
        this.emit(EthereumAPIEvent.PlanetUpdate, newPlanet);
        this.emit(EthereumAPIEvent.RadiusUpdated);
      })
      .on(ContractEvent.ArrivalQueued, async (arrivalId: EthersBN) => {
        const arrival: QueuedArrival | null = await this.getArrival(
          arrivalId.toNumber()
        );
        if (!arrival) {
          console.error('arrival is null');
          return;
        }
        const fromPlanet: Planet = await this.getPlanet(
          locationIdToBigNumber(arrival.fromPlanet)
        );
        const toPlanet: Planet = await this.getPlanet(
          locationIdToBigNumber(arrival.toPlanet)
        );
        this.emit(EthereumAPIEvent.PlanetUpdate, toPlanet);
        this.emit(EthereumAPIEvent.PlanetUpdate, fromPlanet);
        this.emit(EthereumAPIEvent.RadiusUpdated);
      })
      .on(ContractEvent.PlanetUpgraded, async (location) => {
        const planet = await this.getPlanet(location);
        this.emit(EthereumAPIEvent.PlanetUpdate, planet);
      });
  }

  removeEventListeners(): void {
    this.contract.removeAllListeners(ContractEvent.PlayerInitialized);
    this.contract.removeAllListeners(ContractEvent.ArrivalQueued);
  }

  public signMessage(message: string): Promise<string> {
    return this.signer.signMessage(message);
  }

  public getContractAddress(): EthAddress {
    return address(this.contract.address);
  }

  public onTxSubmit(unminedTx: UnconfirmedTx): void {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.print(
      `[TX SUBMIT] ${unminedTx.type} transaction (`,
      TerminalTextStyle.Blue
    );
    terminalEmitter.printLink(
      `${unminedTx.txHash.slice(0, 6)}`,
      () => {
        window.open(`https://ropsten.etherscan.io/tx/${unminedTx.txHash}`);
      },
      TerminalTextStyle.White
    );
    terminalEmitter.println(`) submitted to Ethereum.`, TerminalTextStyle.Blue);
    this.emit(EthereumAPIEvent.TxSubmitted, unminedTx);
    this.provider.waitForTransaction(unminedTx.txHash).then((receipt) => {
      this.onTxConfirmation(unminedTx, receipt.status === 1);
    });
  }

  private onTxConfirmation(unminedTx: UnconfirmedTx, success: boolean) {
    const terminalEmitter = TerminalEmitter.getInstance();
    if (success) {
      terminalEmitter.print(
        `[TX CONFIRM] ${unminedTx.type} transaction (`,
        TerminalTextStyle.Green
      );
      terminalEmitter.printLink(
        `${unminedTx.txHash.slice(0, 6)}`,
        () => {
          window.open(`https://ropsten.etherscan.io/tx/${unminedTx.txHash}`);
        },
        TerminalTextStyle.White
      );
      terminalEmitter.println(`) confirmed.`, TerminalTextStyle.Green);
    } else {
      terminalEmitter.print(
        `[TX ERROR] ${unminedTx.type} transaction (`,
        TerminalTextStyle.Red
      );
      terminalEmitter.printLink(
        `${unminedTx.txHash.slice(0, 6)}`,
        () => {
          window.open(`https://ropsten.etherscan.io/tx/${unminedTx.txHash}`);
        },
        TerminalTextStyle.White
      );
      terminalEmitter.println(
        `) reverted. Please try again.`,
        TerminalTextStyle.Red
      );
    }
    this.emit(EthereumAPIEvent.TxConfirmed, unminedTx);
  }

  async initializePlayer(
    args: InitializePlayerArgs
  ): Promise<providers.TransactionReceipt> {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.println(
      'INIT: calculated SNARK with args:',
      TerminalTextStyle.Sub
    );
    terminalEmitter.println(
      JSON.stringify(hexifyBigIntNestedArray(args.slice(0, 3))),
      TerminalTextStyle.Sub,
      true
    );
    terminalEmitter.println(
      'Open Metamask to confirm the transaction.',
      TerminalTextStyle.White
    );
    terminalEmitter.newline();

    const overrides: providers.TransactionRequest = {
      gasLimit: 2000000,
    };
    const tx: providers.TransactionResponse = await this.contract.initializePlayer(
      ...args,
      overrides
    );
    if (tx.hash) {
      const unminedInitTx: UnconfirmedInit = {
        type: EthTxType.INIT,
        txHash: tx.hash,
        sentAtTimestamp: Math.floor(Date.now() / 1000),
        locationId: locationIdFromDecStr(
          args[ZKArgIdx.DATA][InitArgIdxs.LOCATION_ID]
        ),
      };
      this.onTxSubmit(unminedInitTx);
    }
    return tx.wait();
  }

  async upgradePlanet(
    args: UpgradeArgs
  ): Promise<providers.TransactionReceipt> {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.println(
      'UPGRADE: sending upgrade to blockchain',
      TerminalTextStyle.Sub
    );
    terminalEmitter.newline();

    const overrides: providers.TransactionRequest = {
      gasLimit: 2000000,
    };
    const tx: providers.TransactionResponse = await this.contract.upgradePlanet(
      ...args,
      overrides
    );
    if (tx.hash) {
      const unminedUpgradeTx: UnconfirmedUpgrade = {
        type: EthTxType.UPGRADE,
        txHash: tx.hash,
        sentAtTimestamp: Math.floor(Date.now() / 1000),
        locationId: locationIdFromDecStr(args[UpgradeArgIdxs.LOCATION_ID]),
        upgradeBranch: parseInt(args[UpgradeArgIdxs.UPGRADE_BRANCH]),
      };
      this.onTxSubmit(unminedUpgradeTx);
    }
    return tx.wait();
  }

  async move(
    snarkArgs: MoveSnarkArgs,
    shipsMoved: number,
    silverMoved: number
  ): Promise<providers.TransactionReceipt> {
    const terminalEmitter = TerminalEmitter.getInstance();

    const overrides: providers.TransactionRequest = {
      gasLimit: 2000000,
    };
    const args = [
      snarkArgs[ZKArgIdx.PROOF_A],
      snarkArgs[ZKArgIdx.PROOF_B],
      snarkArgs[ZKArgIdx.PROOF_C],
      [
        ...snarkArgs[ZKArgIdx.DATA],
        (shipsMoved * contractPrecision).toString(),
        (silverMoved * contractPrecision).toString(),
      ],
    ] as MoveArgs;
    terminalEmitter.println(
      'MOVE: calculated SNARK with args:',
      TerminalTextStyle.Sub
    );
    terminalEmitter.println(
      JSON.stringify(hexifyBigIntNestedArray(args.slice(0, 3))),
      TerminalTextStyle.Sub,
      true
    );
    terminalEmitter.newline();

    const tx: providers.TransactionResponse = await this.contract.move(
      ...args,
      overrides
    );
    if (tx.hash) {
      const forcesFloat = parseFloat(
        args[ZKArgIdx.DATA][MoveArgIdxs.SHIPS_SENT]
      );
      const silverFloat = parseFloat(
        args[ZKArgIdx.DATA][MoveArgIdxs.SILVER_SENT]
      );

      const unminedMoveTx: UnconfirmedMove = {
        type: EthTxType.MOVE,
        txHash: tx.hash,
        sentAtTimestamp: Math.floor(Date.now() / 1000),
        from: locationIdFromDecStr(args[ZKArgIdx.DATA][MoveArgIdxs.FROM_ID]),
        to: locationIdFromDecStr(args[ZKArgIdx.DATA][MoveArgIdxs.TO_ID]),
        forces: forcesFloat / contractPrecision,
        silver: silverFloat / contractPrecision,
      };
      this.onTxSubmit(unminedMoveTx);
    }
    return tx.wait();
  }

  async getConstants(): Promise<ContractConstants> {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.println('Getting game constants...', TerminalTextStyle.Sub);

    const contract = this.contract;
    const res = await Promise.all([
      contract.PERLIN_THRESHOLD(),
      contract.PLANET_RARITY(),
      contract.TRADING_POST_RARITY(),
      contract.SILVER_RARITY(),
      contract.TRADING_POST_BARBARIANS(),
      contract.ENERGY_CAP(),
      contract.ENERGY_PER_SECOND(),
      contract.getUpgrades(),
    ]);
    const timeFactorPercentage = this.usingMockchain
      ? parseInt(await contract.timeFactorPercentage())
      : 100;
    const PERLIN_THRESHOLD = res[0].toNumber();
    const PLANET_RARITY = res[1].toNumber();
    const TRADING_POST_RARITY = res[2].toNumber();
    const SILVER_RARITY = res[3].toNumber();
    const TRADING_POST_BARBARIANS = res[4].toNumber();

    const ENERGY_CAP = res[5].toNumber() / contractPrecision;
    const ENERGY_PER_SECOND = res[6].toNumber() / contractPrecision;
    const rawUpgrades = res[7];
    const upgrades: UpgradesInfo = this.rawUpgradesInfoToUpgradesInfo(
      rawUpgrades
    );

    terminalEmitter.println(
      'Getting default planet stats...',
      TerminalTextStyle.Sub
    );
    const rawDefaults: RawDefaults = await contract.getDefaultStats();

    return {
      timeFactorPercentage,
      PERLIN_THRESHOLD,
      PLANET_RARITY,

      TRADING_POST_RARITY,
      SILVER_RARITY,
      TRADING_POST_BARBARIANS,

      defaultPopulationCap: rawDefaults.map(
        (x) => x[1].toNumber() / contractPrecision
      ),
      defaultPopulationGrowth: rawDefaults.map(
        (x) => x[2].toNumber() / contractPrecision
      ),
      defaultRange: rawDefaults.map((x) => x[3].toNumber()),
      defaultSilverGrowth: rawDefaults.map(
        (x) => x[4].toNumber() / contractPrecision
      ),
      defaultSilverCap: rawDefaults.map(
        (x) => x[5].toNumber() / contractPrecision
      ),
      defaultSilverMax: rawDefaults.map(
        (x) => x[6].toNumber() / contractPrecision
      ),
      defaultBarbarianPercentage: rawDefaults.map((x) => x[7].toNumber()),

      planetLevelThresholds: (
        await contract.getPlanetLevelThresholds()
      ).map((x: EthersBN) => x.toNumber()),
      planetTypeThresholds: (
        await contract.getPlanetTypeThresholds()
      ).map((x: EthersBN) => x.toNumber()),
      planetCumulativeRarities: (
        await contract.getPlanetCumulativeRarities()
      ).map((x: EthersBN) => x.toNumber()),

      ENERGY_CAP,
      ENERGY_PER_SECOND,
      upgrades,
    };
  }

  async getPlayers(): Promise<PlayerMap> {
    const contract = this.contract;
    const nPlayers: number = await contract.getNPlayers();

    const playerIds = await aggregateBulkGetter<EthAddress>(
      nPlayers,
      50,
      async (start, end) =>
        (await contract.bulkGetPlayers(start, end)).map(address)
    );

    const playerMap: PlayerMap = {};
    for (const playerId of playerIds) {
      playerMap[address(playerId)] = { address: address(playerId) };
    }
    return playerMap;
  }

  async getWorldRadius(): Promise<number> {
    const radius = (await this.contract.worldRadius()).toNumber();
    return radius;
  }

  async getBalance(): Promise<number> {
    const rawBalance = await this.contract.getBalance();
    const myBalance = utils.formatEther(rawBalance);
    const numBalance = parseFloat(myBalance);
    return numBalance;
  }

  async getArrival(arrivalId: number): Promise<QueuedArrival | null> {
    const contract = this.contract;
    const rawArrival: RawArrivalData = await contract.planetArrivals(arrivalId);
    return this.rawArrivalToObject(rawArrival);
  }

  async getArrivalsForPlanet(planet: Planet): Promise<QueuedArrival[]> {
    const contract = this.contract;

    const events = (
      await contract.getPlanetArrivals(locationIdToDecStr(planet.locationId))
    ).map(this.rawArrivalToObject);

    return events;
  }

  async getAllArrivals(): Promise<QueuedArrival[]> {
    const contract = this.contract;
    const nPlanets: number = await contract.getNPlanets();

    const arrivalsUnflattened = await aggregateBulkGetter<QueuedArrival[]>(
      nPlanets,
      20,
      async (start, end) => {
        return (
          await contract.bulkGetPlanetArrivals(start, end)
        ).map((arrivals: RawArrivalData[]) =>
          arrivals.map(this.rawArrivalToObject)
        );
      }
    );

    return _.flatten(arrivalsUnflattened);
  }

  async getPlanets(): Promise<PlanetMap> {
    const contract = this.contract;
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.println('Getting planet data...');
    const nPlanets: number = await contract.getNPlanets();

    const planetIds = await aggregateBulkGetter<BigInteger>(
      nPlanets,
      60,
      async (start, end) => await contract.bulkGetPlanetIds(start, end)
    );
    const rawPlanets = await aggregateBulkGetter<RawPlanetData>(
      nPlanets,
      60,
      async (start, end) => await contract.bulkGetPlanets(start, end)
    );
    const rawPlanetsExtendedInfo = await aggregateBulkGetter<
      RawPlanetExtendedInfo
    >(
      nPlanets,
      60,
      async (start, end) =>
        await contract.bulkGetPlanetsExtendedInfo(start, end)
    );

    const planets: PlanetMap = {};
    for (let i = 0; i < nPlanets; i += 1) {
      if (!!rawPlanets[i] && !!rawPlanetsExtendedInfo[i]) {
        const planet = this.rawPlanetToObject(
          planetIds[i].toString(),
          rawPlanets[i],
          rawPlanetsExtendedInfo[i]
        );
        planets[planet.locationId as string] = planet;
      }
    }
    return planets;
  }

  private async getPlanet(rawLoc: EthersBN): Promise<Planet> {
    const rawPlanet = await this.contract.planets(rawLoc);
    const rawPlanetExtendedInfo = await this.contract.planetsExtendedInfo(
      rawLoc
    );
    return this.rawPlanetToObject(
      rawLoc.toString(),
      rawPlanet,
      rawPlanetExtendedInfo
    );
  }

  // not strictly necessary but it's cleaner
  private rawArrivalToObject(rawArrival: RawArrivalData): QueuedArrival {
    const rawId = rawArrival[0];
    const rawPlayer = rawArrival[1];
    const rawFromPlanet = rawArrival[2];
    const rawToPlanet = rawArrival[3];
    const rawPopArriving = rawArrival[4];
    const rawSilverMoved = rawArrival[5];
    const rawDepartureTime = rawArrival[6];
    const rawArrivalTime = rawArrival[7];

    const arrival: QueuedArrival = {
      eventId: rawId.toString(),
      player: address(rawPlayer),
      fromPlanet: locationIdFromDecStr(rawFromPlanet.toString()),
      toPlanet: locationIdFromDecStr(rawToPlanet.toString()),
      popArriving: rawPopArriving.toNumber() / contractPrecision,
      silverMoved: rawSilverMoved.toNumber() / contractPrecision,
      departureTime: rawDepartureTime.toNumber(),
      arrivalTime: rawArrivalTime.toNumber(),
    };

    return arrival;
  }

  private rawPlanetToObject(
    rawLocationId: string,
    rawPlanet: RawPlanetData,
    rawPlanetExtendedInfo: RawPlanetExtendedInfo
  ): Planet {
    const rawOwner = rawPlanet[0];
    const rawRange = rawPlanet[1];
    const rawPopulation = rawPlanet[2];
    const rawPopulationCap = rawPlanet[3];
    const rawPopulationGrowth = rawPlanet[4];
    const rawPlanetResource = rawPlanet[5];
    const rawSilverCap = rawPlanet[6];
    const rawSilverGrowth = rawPlanet[7];
    const rawSilver = rawPlanet[8];
    const rawSilverMax = rawPlanet[9];
    const rawPlanetLevel = rawPlanet[10];
    const rawPlanetType = rawPlanet[11];

    const rawIsInitialized = rawPlanetExtendedInfo[0];
    const rawVersion = rawPlanetExtendedInfo[1];
    const rawLastUpdated = rawPlanetExtendedInfo[2];
    const rawUpgradeState = [
      rawPlanetExtendedInfo[3],
      rawPlanetExtendedInfo[4],
      rawPlanetExtendedInfo[5],
    ];

    const planet: Planet = {
      locationId: locationIdFromDecStr(rawLocationId.toString()),
      owner: address(rawOwner),

      planetLevel: rawPlanetLevel.toNumber(),
      planetType: rawPlanetType,
      planetResource: rawPlanetResource,

      populationCap: rawPopulationCap.toNumber() / contractPrecision,
      populationGrowth: rawPopulationGrowth.toNumber() / contractPrecision,

      silverCap: rawSilverCap.toNumber() / contractPrecision,
      silverGrowth: rawSilverGrowth.toNumber() / contractPrecision,

      silverMax: rawSilverMax.toNumber() / contractPrecision,

      population: rawPopulation.toNumber() / contractPrecision,
      silver: rawSilver.toNumber() / contractPrecision,

      range: rawRange.toNumber(),

      // metadata
      isInitialized: rawIsInitialized,
      version: rawVersion.toNumber(),
      lastUpdated: rawLastUpdated.toNumber(),
      upgradeState: [
        rawUpgradeState[0].toNumber(),
        rawUpgradeState[1].toNumber(),
        rawUpgradeState[2].toNumber(),
      ],

      unconfirmedDepartures: [],
      unconfirmedUpgrades: [],
      silverSpent: 0, // this is stale and will be updated in planethelper
    };
    return planet;
  }

  private rawUpgradeToUpgrade(rawUpgrade: RawUpgrade): Upgrade {
    return {
      popCapMultiplier: rawUpgrade[0].toNumber(),
      popGroMultiplier: rawUpgrade[1].toNumber(),
      silverCapMultiplier: rawUpgrade[2].toNumber(),
      silverGroMultiplier: rawUpgrade[3].toNumber(),
      silverMaxMultiplier: rawUpgrade[4].toNumber(),
      rangeMultiplier: rawUpgrade[5].toNumber(),
      silverCostMultiplier: rawUpgrade[6].toNumber(),
    };
  }

  private rawUpgradesInfoToUpgradesInfo(
    rawUpgradesInfo: RawUpgradesInfo
  ): UpgradesInfo {
    return rawUpgradesInfo.map((a) =>
      a.map((b) => this.rawUpgradeToUpgrade(b))
    ) as UpgradesInfo;
  }
}

export default EthereumAPI;
