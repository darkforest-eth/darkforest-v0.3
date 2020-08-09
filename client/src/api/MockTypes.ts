export enum MockchainEvents {
  RegisterPlayer = 'RegisterPlayer',
  BlockMined = 'BlockMined',
}

export interface MockchainResponse {
  data?: SerializedMockchainData;
  txHash?: string;
  type: MockchainResponseType;
}

export interface TypedBigNum {
  type: 'BigNumber';
  value: string;
}

export function isTypedBigNum(
  data: SerializedMockchainData
): data is TypedBigNum {
  if (!data || typeof data !== 'object') return false;
  return (data as TypedBigNum).type === 'BigNumber';
}

export type ServerMockchainData =
  | null
  | undefined
  | number
  | string
  | boolean
  | bigint
  | ServerMockchainData[]
  | {
      [key in string | number]: ServerMockchainData;
    };

export type SerializedMockchainData =
  | null
  | undefined
  | number
  | string
  | boolean
  | TypedBigNum
  | SerializedMockchainData[]
  | {
      [prop: string]: SerializedMockchainData;
    };

export enum MockchainResponseType {
  View,
  Mutation,
  Error,
}

export type MockMinedBlock = {
  metadata: {
    blockNumber: number;
    timestamp: number;
  };
  txHashes: string[];
};
