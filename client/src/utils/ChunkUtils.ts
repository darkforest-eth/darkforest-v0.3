import {
  LSMBucket,
  LSMChunkData,
  LSMLoc,
} from '../_types/darkforest/api/LocalStorageManagerTypes';
import {
  ChunkFootprint,
  ExploredChunkData,
  Location,
} from '../_types/global/GlobalTypes';
import { WorldCoords } from './Coordinates';

export const getBucket: (chunk: ChunkFootprint) => LSMBucket = (chunk) => {
  const alphanumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum =
    (Math.floor(chunk.bottomLeft.x / chunk.sideLength) +
      Math.floor(chunk.bottomLeft.y / chunk.sideLength)) %
    alphanumeric.length;
  if (sum < 0) sum += alphanumeric.length;
  return alphanumeric[sum];
};

export const getChunkKey = (chunkLoc: ChunkFootprint) => {
  const ret =
    `${getBucket(chunkLoc)},` +
    `${chunkLoc.sideLength},` +
    `${chunkLoc.bottomLeft.x},` +
    `${chunkLoc.bottomLeft.y}`;
  return ret;
};

export const toLSMChunk = (chunk: ExploredChunkData) => {
  const lsmLocs: LSMLoc[] = [];
  const { chunkFootprint: chunkLocation } = chunk;
  for (const location of chunk.planetLocations) {
    lsmLocs.push({
      x: location.coords.x,
      y: location.coords.y,
      h: location.hash,
      p: location.perlin,
    });
  }
  const ret: LSMChunkData = {
    x: chunkLocation.bottomLeft.x,
    y: chunkLocation.bottomLeft.y,
    s: chunkLocation.sideLength,
    l: lsmLocs,
  };
  return ret;
};

export const toExploredChunk = (chunk: LSMChunkData) => {
  const planetLocs: Location[] = [];
  for (const lsmLoc of chunk.l) {
    planetLocs.push({
      coords: { x: lsmLoc.x, y: lsmLoc.y },
      hash: lsmLoc.h,
      perlin: lsmLoc.p,
    });
  }
  const ret: ExploredChunkData = {
    chunkFootprint: {
      bottomLeft: { x: chunk.x, y: chunk.y },
      sideLength: chunk.s,
    },
    planetLocations: planetLocs,
  };
  return ret;
};

export const getSiblingLocations = (chunkLoc: ChunkFootprint) => {
  const doubleSideLen = 2 * chunkLoc.sideLength;
  const newBottomLeftX =
    Math.floor(chunkLoc.bottomLeft.x / doubleSideLen) * doubleSideLen;
  const newBottomLeftY =
    Math.floor(chunkLoc.bottomLeft.y / doubleSideLen) * doubleSideLen;
  const newBottomLeft = { x: newBottomLeftX, y: newBottomLeftY };
  const siblingLocs: ChunkFootprint[] = [];
  for (let i = 0; i < 2; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const x = newBottomLeft.x + i * chunkLoc.sideLength;
      const y = newBottomLeft.y + j * chunkLoc.sideLength;
      if (x === chunkLoc.bottomLeft.x && y === chunkLoc.bottomLeft.y) {
        continue;
      }
      siblingLocs.push({
        bottomLeft: { x, y },
        sideLength: chunkLoc.sideLength,
      });
    }
  }
  const ret: [ChunkFootprint, ChunkFootprint, ChunkFootprint] = [
    siblingLocs[0],
    siblingLocs[1],
    siblingLocs[2],
  ];
  return ret; // necessary for typescript type inference
};

export const getChunkOfSideLength = (
  coords: WorldCoords,
  sideLength: number
) => {
  const oldBottomLeftX = coords.x;
  const oldBottomLeftY = coords.y;
  const ret: ChunkFootprint = {
    sideLength,
    bottomLeft: {
      x: Math.floor(oldBottomLeftX / sideLength) * sideLength,
      y: Math.floor(oldBottomLeftY / sideLength) * sideLength,
    },
  };
  return ret;
};

export const addToChunkMap = (
  map: Map<string, ExploredChunkData>,
  chunk: ExploredChunkData,
  includePlanets = true,
  onAdd?: (ExploredChunkData) => void,
  onRemove?: (ExploredChunkData) => void,
  maxChunkSize?: number
) => {
  let sideLength = chunk.chunkFootprint.sideLength;
  let chunkToAdd: ExploredChunkData = {
    chunkFootprint: {
      bottomLeft: chunk.chunkFootprint.bottomLeft,
      sideLength,
    },
    planetLocations: includePlanets ? [...chunk.planetLocations] : [],
  };
  while (!maxChunkSize || sideLength < maxChunkSize) {
    const siblingLocs = getSiblingLocations(chunkToAdd.chunkFootprint);
    let siblingsMined = true;
    for (const siblingLoc of siblingLocs) {
      if (!map.get(getChunkKey(siblingLoc))) {
        siblingsMined = false;
        break;
      }
    }
    if (!siblingsMined) break;
    sideLength *= 2;
    let planetLocations: Location[] = chunkToAdd.planetLocations;
    for (const siblingLoc of siblingLocs) {
      const siblingKey = getChunkKey(siblingLoc);
      const sibling = map.get(siblingKey);
      if (onRemove !== undefined) {
        onRemove(sibling);
      } else {
        map.delete(siblingKey);
      }
      if (includePlanets && sibling) {
        planetLocations = planetLocations.concat(sibling.planetLocations);
      }
    }
    const chunkFootprint = getChunkOfSideLength(
      chunkToAdd.chunkFootprint.bottomLeft,
      sideLength
    );
    chunkToAdd = {
      chunkFootprint,
      planetLocations,
    };
  }
  if (onAdd !== undefined) {
    onAdd(chunkToAdd);
  } else {
    map.set(getChunkKey(chunkToAdd.chunkFootprint), chunkToAdd);
  }
};
