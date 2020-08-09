import { LocationId } from '../../global/GlobalTypes';

// (capital) alphanumeric character
// a "bucket" index deterministically generated from chunkX and chunkY
export type LSMBucket = string;

export interface LSMLoc {
  x: number;
  y: number;
  h: LocationId;
  p: number; // perlin
}

export interface LSMChunkData {
  x: number; // left
  y: number; // bottom
  s: number; // side length
  l: LSMLoc[];
}
