import mimcHash from './mimc';
import * as bigInt from 'big-integer';
import { LOCATION_ID_UB } from '../utils/constants';
import { BigInteger } from 'big-integer';
import {
  ExploredChunkData,
  Location,
  MinerWorkerMessage,
  ChunkFootprint,
} from '../_types/global/GlobalTypes';
import { locationIdFromBigInt } from '../utils/CheckedTypeUtils';
import { getPlanetLocations } from './permutation';
import perlin from './perlin';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ctx: Worker = self as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const exploreChunk = (
  chunkFootprint: ChunkFootprint,
  workerIndex: number,
  totalWorkers: number,
  planetRarity: number,
  jobId: number,
  useFakeHash: boolean
) => {
  let planetLocations: Location[] = [];
  if (useFakeHash) {
    planetLocations =
      workerIndex > 0 ? [] : getPlanetLocations(chunkFootprint, planetRarity);
  } else {
    const planetRarityBI: BigInteger = bigInt(planetRarity);
    let count = 0;
    const { x: bottomLeftX, y: bottomLeftY } = chunkFootprint.bottomLeft;
    const { sideLength } = chunkFootprint;
    for (let x = bottomLeftX; x < bottomLeftX + sideLength; x++) {
      for (let y = bottomLeftY; y < bottomLeftY + sideLength; y++) {
        if (count % totalWorkers === workerIndex) {
          const hash: BigInteger = mimcHash(x, y);
          if (hash.lesser(LOCATION_ID_UB.divide(planetRarityBI))) {
            planetLocations.push({
              coords: { x, y },
              hash: locationIdFromBigInt(hash),
              perlin: perlin({ x, y }),
            });
          }
        }
        count += 1;
      }
    }
  }
  const chunkData: ExploredChunkData = {
    chunkFootprint,
    planetLocations,
  };
  ctx.postMessage(JSON.stringify([chunkData, jobId]));
};

ctx.addEventListener('message', (e: MessageEvent) => {
  const exploreMessage: MinerWorkerMessage = JSON.parse(
    e.data
  ) as MinerWorkerMessage;

  exploreChunk(
    exploreMessage.chunkFootprint,
    exploreMessage.workerIndex,
    exploreMessage.totalWorkers,
    exploreMessage.planetRarity,
    exploreMessage.jobId,
    exploreMessage.useMockHash
  );
});
