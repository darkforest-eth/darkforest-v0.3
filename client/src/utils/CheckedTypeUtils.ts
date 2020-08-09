import { EthAddress, LocationId } from '../_types/global/GlobalTypes';
import * as bigInt from 'big-integer';
import { LOCATION_ID_UB } from './constants';
import { BigInteger } from 'big-integer';
import { BigNumber as EthersBN } from 'ethers';

// constructors for specific types
// this pattern ensures that LocationIds and Addresses can only be initialized through constructors that do
// appropriate validation
// see https://stackoverflow.com/questions/51813272/declaring-string-type-with-min-max-length-in-typescript
export const locationIdFromHexStr: (location: string) => LocationId = (
  location
) => {
  const locationBI = bigInt(location, 16);
  if (locationBI.geq(LOCATION_ID_UB)) throw new Error('not a valid location');
  let ret = locationBI.toString(16);
  while (ret.length < 64) ret = '0' + ret;
  return ret as LocationId;
};

export const locationIdFromDecStr: (location: string) => LocationId = (
  location
) => {
  const locationBI = bigInt(location);
  if (locationBI.geq(LOCATION_ID_UB)) throw new Error('not a valid location');
  let ret = locationBI.toString(16);
  while (ret.length < 64) ret = '0' + ret;
  return ret as LocationId;
};

export const locationIdFromBigInt: (location: BigInteger) => LocationId = (
  location
) => {
  const locationBI = bigInt(location);
  if (locationBI.geq(LOCATION_ID_UB)) throw new Error('not a valid location');
  let ret = locationBI.toString(16);
  while (ret.length < 64) ret = '0' + ret;
  return ret as LocationId;
};

export const locationIdToHexStr: (locationId: LocationId) => string = (
  locationId
) => {
  return locationId as string;
};

export const locationIdToDecStr: (locationId: LocationId) => string = (
  locationId
) => {
  return bigInt(locationId, 16).toString(10);
};

export const locationIdToBigNumber: (location: LocationId) => EthersBN = (
  location
) => {
  return EthersBN.from('0x' + location);
};

export const address: (str: string) => EthAddress = (str) => {
  let ret = str.toLowerCase();
  if (ret.slice(0, 2) === '0x') {
    ret = ret.slice(2);
  }
  for (const c of ret) {
    if ('0123456789abcdef'.indexOf(c) === -1)
      throw new Error('not a valid address');
  }
  if (ret.length !== 40) throw new Error('not a valid address');
  return `0x${ret}` as EthAddress;
};

export const emptyAddress = address('0000000000000000000000000000000000000000');

export const emptyLocationId = locationIdFromHexStr(
  '0000000000000000000000000000000000000000000000000000000000000000'
);
