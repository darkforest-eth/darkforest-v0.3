import * as bigInt from 'big-integer';
import { BigInteger } from 'big-integer';
import { Witness } from 'snarkjs';
import {
  Planet,
  LocationId,
  Bonus,
  PlanetClass,
  EthAddress,
  UpgradeState,
} from '../_types/global/GlobalTypes';
import { address, emptyAddress } from './CheckedTypeUtils';
import _ from 'lodash';
import { useState, useCallback } from 'react';
import TerminalEmitter from './TerminalEmitter';

//https://stackoverflow.com/questions/53215285/how-can-i-force-component-to-re-render-with-hooks-in-react
export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);
  return update;
}

// largely taken from websnark/tools/buildwitness.js, and typed by us (see src/@types/snarkjs)

interface DataViewWithOffset {
  dataView: DataView;
  offset: number;
}

function _writeUint32(h: DataViewWithOffset, val: number): void {
  h.dataView.setUint32(h.offset, val, true);
  h.offset += 4;
}

function _writeBigInt(h: DataViewWithOffset, bi: BigInteger): void {
  for (let i = 0; i < 8; i++) {
    const v = bigInt(bi)
      .shiftRight(i * 32)
      .and(0xffffffff)
      .toJSNumber();
    _writeUint32(h, v);
  }
}

function _calculateBuffLen(witness: Witness): number {
  let size = 0;

  // beta2, delta2
  size += witness.length * 32;

  return size;
}

export const witnessObjToBuffer: (witness: Witness) => ArrayBuffer = (
  witness
) => {
  const buffLen: number = _calculateBuffLen(witness);

  const buff = new ArrayBuffer(buffLen);

  const h: DataViewWithOffset = {
    dataView: new DataView(buff),
    offset: 0,
  };

  for (let i = 0; i < witness.length; i++) {
    _writeBigInt(h, witness[i]);
  }

  return buff;
};

type NestedBigIntArray = (BigInteger | string | NestedBigIntArray)[];

export const hexifyBigIntNestedArray = (arr: NestedBigIntArray) => {
  return arr.map((value) => {
    if (Array.isArray(value)) {
      return hexifyBigIntNestedArray(value);
    } else {
      if (typeof value === 'string') {
        const valueBI = bigInt(value as string);
        return '0x' + valueBI.toString(16);
      } else {
        return '0x' + value.toString(16);
      }
    }
  });
};

// color utils

export const hslStr: (h: number, s: number, l: number) => string = (
  h,
  s,
  l
) => {
  return `hsl(${h % 360},${s}%,${l}%)`;
};
function hashToHue(hash: string): number {
  let seed = bigInt(hash, 16).and(0xffffff).toString(16);
  seed = '0x' + '0'.repeat(6 - seed.length) + seed;

  const baseHue = parseInt(seed) % 360;
  return baseHue;
}

export const getPlayerColor: (player: EthAddress) => string = (player) => {
  return hslStr(hashToHue(player.slice(2)), 100, 70); // remove 0x
};

export const getOwnerColor: (planet: Planet) => string = (planet) => {
  return planet.owner ? getPlayerColor(planet.owner) : 'hsl(0,1%,50%)';
};

export const formatNumber = (num: number): string => {
  if (num < 100) return `${num.toFixed(2)}`;

  const suffixes = ['', 'K', 'M', 'B', 'T', 'q', 'Q'];
  let log000 = 0;
  let rem = num;
  while (rem / 1000 >= 1) {
    rem /= 1000;
    log000++;
  }

  return `${rem.toFixed(2)}${suffixes[log000]}`;
};

export const seededRandom = (s: number) => {
  const x = Math.sin(s) * 10000;
  return x - Math.floor(x);
};

export const getFormatProp = (planet: Planet | null, prop: string): string => {
  if (!planet) return '0';
  if (prop === 'silverGrowth') return formatNumber(planet[prop] * 60);
  else return formatNumber(planet[prop]);
};

export const getPlanetClass = (planet: Planet | null): PlanetClass => {
  if (!planet) return PlanetClass.None;

  let count = 0;
  let main = PlanetClass.None;
  for (let i = 0; i < 3; i++) {
    if (planet.upgradeState[i] > 2) {
      main = i;
      count++;
    }
  }

  if (count > 1) console.error('upgrade stat is invalid!');
  return main;
};

export const getPlanetRank = (planet: Planet | null): number => {
  if (!planet) return 0;
  return Math.max(...planet.upgradeState);
};

export const getPlanetShortHash = (planet: Planet | null): string => {
  if (!planet) return '00000';
  else return planet.locationId.substring(4, 9);
};

export const getPlayerShortHash = (address: EthAddress): string => {
  return address.substring(0, 6);
};

const compStates = (a: UpgradeState, b: UpgradeState): boolean => {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

export const isFullRank = (planet: Planet | null): boolean => {
  if (!planet) return true;
  else
    return (
      compStates(planet.upgradeState, [2, 2, 4]) ||
      compStates(planet.upgradeState, [2, 4, 2]) ||
      compStates(planet.upgradeState, [4, 2, 2])
    );
};

//https://stackoverflow.com/questions/32589197/how-can-i-capitalize-the-first-letter-of-each-word-in-a-string-using-javascript/45620677#45620677
export const titleCase = (title) =>
  title
    .split(/ /g)
    .map((word) => `${word.substring(0, 1).toUpperCase()}${word.substring(1)}`)
    .join(' ');

export const randomAddress = (): string => {
  return address(
    '0x' +
      _.join(
        _.times(40, () => _.random(0, 15).toString(16)),
        ''
      )
  );
};

export const moveShipsDecay = (
  shipsMoved: number,
  fromPlanet: Planet,
  dist: number
) => {
  const scale = (1 / 2) ** (dist / fromPlanet.range);
  let ret = scale * shipsMoved - 0.05 * fromPlanet.populationCap;
  if (ret < 0) ret = 0;

  return ret;
};

export const getBytesFromHex = (
  hexStr: string,
  startByte: number,
  endByte: number
) => {
  const byteString = hexStr.substring(2 * startByte, 2 * endByte);
  return bigInt(`0x${byteString}`);
};

export const bonusFromHex = (hex: LocationId): Bonus => {
  const bonuses = Array(5).fill(false) as Bonus;

  for (let i = 0; i < 5; i++) {
    bonuses[i] = getBytesFromHex(hex, 11 + i, 12 + i).lesser(16);
  }

  return bonuses;
};

export const hasOwner = (planet: Planet) => {
  // planet.owner should never be null
  return planet.owner !== emptyAddress;
};

export const aggregateBulkGetter = async <T>(
  total: number,
  querySize: number,
  getterFn: (startIdx: number, endIdx: number) => Promise<T[]>,
  printProgress = false
) => {
  const terminalEmitter = TerminalEmitter.getInstance();
  const promises: Promise<T[]>[] = [];
  let soFar = 0;
  for (let i = 0; i < total / querySize; i += 1) {
    const start = i * querySize;
    const end = Math.min((i + 1) * querySize, total);
    promises.push(
      getterFn(start, end)
        .then((res) => {
          if (
            printProgress &&
            Math.floor((soFar * 20) / total) !==
              Math.floor(((soFar + querySize) * 20) / total)
          ) {
            // print every 5%
            const percent = Math.floor(((soFar + querySize) * 20) / total) * 5;
            terminalEmitter.print(`${percent}%... `);
          }
          soFar += querySize;
          return res;
        })
        .catch((err) => {
          console.error(
            `error ${JSON.stringify(err)} occurred querying ${start}-${end}`
          );
          return [];
        })
    );
  }
  const unflattenedResults = await Promise.all(promises);
  if (printProgress) {
    terminalEmitter.newline();
  }
  return _.flatten(unflattenedResults);
};
