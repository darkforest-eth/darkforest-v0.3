import {
  ExploredChunkData,
  ChunkFootprint,
  MinerWorkerMessage,
} from '../_types/global/GlobalTypes';
import Worker from 'worker-loader!../miner/miner.worker';
import { EventEmitter } from 'events';
import _ from 'lodash';
import LocalStorageManager from './LocalStorageManager';
import { MiningPattern } from '../utils/MiningPatterns';

export enum MinerManagerEvent {
  DiscoveredNewChunk = 'DiscoveredNewChunk',
}

class MinerManager extends EventEmitter {
  private readonly minedChunksStore: LocalStorageManager;
  private isExploring = false;
  private miningPattern: MiningPattern;
  private workers: Worker[];
  private worldRadius: number;
  private readonly planetRarity: number;
  private cores = 1;
  private exploringChunk: { [chunkKey: string]: ExploredChunkData } = {};
  private exploringChunkStart: { [chunkKey: string]: number } = {};
  private minersComplete: { [chunkKey: string]: number } = {};
  private currentJobId = 0;
  private useMockHash;

  private constructor(
    minedChunksStore: LocalStorageManager,
    miningPattern: MiningPattern,
    worldRadius: number,
    planetRarity: number,
    useMockHash: boolean
  ) {
    super();

    this.minedChunksStore = minedChunksStore;
    this.miningPattern = miningPattern;
    this.worldRadius = worldRadius;
    this.planetRarity = planetRarity;
    // this.cores = navigator.hardwareConcurrency;
    this.workers = [];
    this.useMockHash = useMockHash;
    if (useMockHash) {
      this.cores = 1;
    }
  }

  setMiningPattern(pattern: MiningPattern): void {
    this.miningPattern = pattern;

    if (this.isExploring) {
      this.stopExplore();
      this.startExplore();
    }
  }

  getMiningPattern(): MiningPattern {
    return this.miningPattern;
  }

  destroy(): void {
    this.workers.map((x) => x.terminate());
  }

  static create(
    chunkStore: LocalStorageManager,
    miningPattern: MiningPattern,
    worldRadius: number,
    planetRarity: number,
    useMockHash = false
  ): MinerManager {
    const minerManager = new MinerManager(
      chunkStore,
      miningPattern,
      worldRadius,
      planetRarity,
      useMockHash
    );
    _.range(minerManager.cores).forEach((i) => minerManager.initWorker(i));

    return minerManager;
  }

  private initWorker(index: number): void {
    this.workers[index] = new Worker();
    this.workers[index].onmessage = (e: MessageEvent) => {
      // worker explored a slice of a chunk
      const [exploredChunk, jobId] = JSON.parse(e.data) as [
        ExploredChunkData,
        number
      ];
      const chunkKey = this.chunkLocationToKey(
        exploredChunk.chunkFootprint,
        jobId
      );
      this.exploringChunk[chunkKey].planetLocations.push(
        ...exploredChunk.planetLocations
      );

      this.minersComplete[chunkKey] += 1;
      if (this.minersComplete[chunkKey] === this.workers.length) {
        this.onDiscovered(this.exploringChunk[chunkKey], jobId);
      }
    };
  }

  private async onDiscovered(
    exploredChunk: ExploredChunkData,
    jobId: number
  ): Promise<void> {
    const discoveredLoc = exploredChunk.chunkFootprint;
    const chunkKey = this.chunkLocationToKey(discoveredLoc, jobId);
    this.minedChunksStore.updateChunk(exploredChunk);
    const miningTimeMillis = Date.now() - this.exploringChunkStart[chunkKey];
    this.emit(
      MinerManagerEvent.DiscoveredNewChunk,
      exploredChunk,
      miningTimeMillis
    );
    delete this.exploringChunk[chunkKey];
    delete this.minersComplete[chunkKey];
    delete this.exploringChunkStart[chunkKey];

    if (this.isExploring && this.currentJobId === jobId) {
      this.exploreNext(discoveredLoc, jobId);
    }
  }

  private exploreNext(fromChunk: ChunkFootprint, jobId: number) {
    this.nextValidExploreTarget(fromChunk, jobId).then(
      (nextChunk: ChunkFootprint | null) => {
        if (!!nextChunk) {
          const nextChunkKey = this.chunkLocationToKey(nextChunk, jobId);
          this.exploringChunk[nextChunkKey] = {
            chunkFootprint: nextChunk,
            planetLocations: [],
          };
          this.exploringChunkStart[nextChunkKey] = Date.now();
          this.minersComplete[nextChunkKey] = 0;
          this.sendMessageToWorkers(nextChunk, jobId);
        }
      }
    );
  }

  public startExplore(): void {
    // increments the current job ID
    if (!this.isExploring) {
      this.isExploring = true;
      this.currentJobId += 1;
      const jobId = this.currentJobId;
      this.exploreNext(this.miningPattern.fromChunk, jobId);
    }
  }

  public stopExplore(): void {
    this.isExploring = false;
  }

  public setRadius(radius: number): void {
    this.worldRadius = radius;
  }

  private async nextValidExploreTarget(
    chunkLocation: ChunkFootprint,
    jobId: number
  ): Promise<ChunkFootprint | null> {
    // returns the first valid chunk equal to or after `chunk` (in the explore order of mining pattern) that hasn't been explored
    // async because it may take indefinitely long to find the next target. this will block UI if done sync
    // we use this trick to promisify:
    // https://stackoverflow.com/questions/10344498/best-way-to-iterate-over-an-array-without-blocking-the-ui/10344560#10344560

    // this function may return null if user chooses to stop exploring or changes mining pattern in the middle of its resolution
    // so any function calling it should handle the null case appropriately
    let candidateChunk = chunkLocation;
    let count = 10000;
    while (!this.isValidExploreTarget(candidateChunk) && count > 0) {
      candidateChunk = this.miningPattern.nextChunk(candidateChunk);
      count -= 1;
    }
    // since user might have switched jobs or stopped exploring during the above loop
    if (!this.isExploring && jobId !== this.currentJobId) {
      return null;
    }
    if (this.isValidExploreTarget(candidateChunk)) {
      return candidateChunk;
    }
    return new Promise((resolve) => {
      setTimeout(async () => {
        const nextNextChunk = await this.nextValidExploreTarget(
          candidateChunk,
          jobId
        );
        resolve(nextNextChunk);
      }, 0);
    });
  }

  private isValidExploreTarget(chunkLocation: ChunkFootprint): boolean {
    const { bottomLeft, sideLength } = chunkLocation;
    const xCenter = bottomLeft.x + sideLength / 2;
    const yCenter = bottomLeft.y + sideLength / 2;
    const xMinAbs = Math.abs(xCenter) - sideLength / 2;
    const yMinAbs = Math.abs(yCenter) - sideLength / 2;
    const squareDist = xMinAbs ** 2 + yMinAbs ** 2;
    // should be inbounds, and unexplored
    return (
      squareDist < this.worldRadius ** 2 &&
      !this.minedChunksStore.hasMinedChunk(chunkLocation)
    );
  }

  private sendMessageToWorkers(
    chunkToExplore: ChunkFootprint,
    jobId: number
  ): void {
    for (
      let workerIndex = 0;
      workerIndex < this.workers.length;
      workerIndex += 1
    ) {
      const msg: MinerWorkerMessage = {
        chunkFootprint: chunkToExplore,
        workerIndex,
        totalWorkers: this.workers.length,
        planetRarity: this.planetRarity,
        jobId,
        useMockHash: this.useMockHash,
      };
      this.workers[workerIndex].postMessage(JSON.stringify(msg));
    }
  }

  private chunkLocationToKey(chunkLocation: ChunkFootprint, jobId: number) {
    const x = chunkLocation.bottomLeft.x;
    const y = chunkLocation.bottomLeft.y;
    const sideLength = chunkLocation.sideLength;
    return `${x}-${y}-${sideLength}-${jobId}`;
  }
}

export default MinerManager;
