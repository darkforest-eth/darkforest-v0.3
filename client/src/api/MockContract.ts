import { Listener, TransactionReceipt } from '@ethersproject/providers';
import { BigNumber as EthersBN } from 'ethers';
import io from 'socket.io-client';
import {
  MockchainEvents,
  MockchainResponse,
  MockchainResponseType,
  SerializedMockchainData,
  isTypedBigNum,
  MockMinedBlock,
} from './MockTypes'; //from '../../../mockchain/src/MockTypes';
import {
  AbstractContract,
  AbstractSigner,
  AbstractProvider,
} from '../api/AbtractContract';
//import EthereumAPI from './EthereumAPI';
// NOTE: DO NOT IMPORT FROM ETHERS SUBPATHS. see https://github.com/ethers-io/ethers.js/issues/349 (these imports trip up webpack)
// for example, the below is bad!
// import {TransactionReceipt, Provider, TransactionResponse, Web3Provider} from "ethers/providers";
import { ClientMockchainData } from '../_types/darkforest/api/EthereumAPITypes';

const post = (url, body) => {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((x) => x.json());
};

const serializeRequestArgs: (
  args: (EthersBN | number | string | boolean | null | undefined)[]
) => (number | string | boolean | null | undefined)[] = (args) => {
  const ret: (number | string | boolean | null | undefined)[] = [];
  for (const arg of args) {
    if (EthersBN.isBigNumber(arg)) {
      ret.push(arg.toString());
    } else {
      ret.push(arg);
    }
  }
  return ret;
};

// for deserializing data (i.e. responses to queries);
const mockchainDeserialize: (
  data: SerializedMockchainData
) => ClientMockchainData = (data) => {
  // turns all TypedBigNums into BigNumber. only does shallow check
  if (isTypedBigNum(data)) {
    return EthersBN.from(data.value);
  } else if (
    typeof data === 'number' ||
    typeof data === 'boolean' ||
    typeof data === 'string' ||
    typeof data === 'undefined'
  ) {
    return data;
  } else if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(mockchainDeserialize);
    } else {
      const ret: ClientMockchainData = {};
      for (const key in data) {
        const v = data[key];
        ret[key] = mockchainDeserialize(v);
      }
      return ret;
    }
  }
  return null;
};

export class MockContract implements AbstractContract {
  readonly address = '0x0000000000000000000000000000000000000000';
  private io: SocketIOClient.Socket;

  // MockContracts must forward arbitararily named functions to the server.
  // However, we want to be able to access non-function properties with this.*, so we can't use [name: string]: Function.
  [k: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(addressOrName: string, mockServerURL: string) {
    this.io = io(mockServerURL);

    this.io.emit(MockchainEvents.RegisterPlayer, addressOrName);

    const handler = {
      get: (target, propKey) => {
        if (propKey in target) {
          return (...args) => target[propKey](...args);
        }
        return async (...args) => {
          const response: MockchainResponse = await post(
            `${mockServerURL}/contract/${propKey}`,
            {
              address: addressOrName,
              args: serializeRequestArgs(args),
            }
          );

          if (response.type === MockchainResponseType.Error) {
            throw Error(`Mockchain error: ${response.data}`);
          } else if (response.type === MockchainResponseType.View) {
            return mockchainDeserialize(response.data);
          } else if (response.type === MockchainResponseType.Mutation) {
            //wait has type () => Promise<TransactionReceipt>
            const waitFn = () =>
              new Promise((resolve, _) => {
                this.io.on(MockchainEvents.BlockMined, () => {
                  resolve({ byzantium: true });
                });
              });

            return {
              //has type Promise<TransactionReceipt>
              hash: response.txHash,
              from: addressOrName,
              wait: waitFn as () => Promise<TransactionReceipt>,
            };
          }
        };
      },
    };

    return new Proxy(this, handler);
  }

  on(event: string, listener: Listener): MockContract {
    this.io.on(event, (...args) => {
      // TODO we should be able to remove this and replace it with regular MockChainDeserialize, but it doesn't work
      const deserializedArgs = args.map(mockchainDeserialize);
      return listener(...deserializedArgs);
    });
    return this;
  }

  removeAllListeners(eventName: string): MockContract {
    this.io.removeListener(eventName);
    return this;
  }
}

export class MockSigner implements AbstractSigner {
  private address: string;

  constructor(address: string) {
    this.address = address;
  }

  getAddress = async (): Promise<string> => {
    return this.address;
    //return new Promise((resolve) => resolve(this.address))
  };

  signMessage = async (message: string): Promise<string> => {
    return Promise.resolve(message + this.address);
  };
}

export class MockProvider implements AbstractProvider {
  private io: SocketIOClient.Socket;
  private mockServerURL: string;

  constructor(mockServerURL: string) {
    this.io = io(mockServerURL);
    this.mockServerURL = mockServerURL;
  }

  waitForTransaction(txHash: string): Promise<TransactionReceipt> {
    return new Promise((resolve) => {
      // listen for transaction
      this.io.on(MockchainEvents.BlockMined, (block: MockMinedBlock) => {
        for (const minedTxHash of block.txHashes) {
          if (minedTxHash === txHash) {
            resolve({
              transactionHash: txHash,
            } as TransactionReceipt);
          }
        }
      });

      // check if transaction was already mined
      post(`${this.mockServerURL}/tx/${txHash}`, {}).then((resp) => {
        if (resp) {
          resolve({
            transactionHash: txHash,
          } as TransactionReceipt);
        }
      });
    });
  }
}

// Useful to make sure that the contract backend is behaving reasonably.

/*
export const TestContract = () => {
  EthereumAPI.createMock('localhost:3000', randomAddress()).then(
    async (api) => {
      console.log(await api.contract.someArray(3));
      // console.log(await api.contract.doesNotExist(3));
      // console.log(await api.contract.doesNotExist());
      console.log(await api.contract.someMap('alan'));
      console.log('brian', await api.contract.someMap('brian'));
      console.log('cv', await api.contract.changingValue());
      const mutResponse = await api.contract.change();
      console.log(mutResponse);
      console.log(await mutResponse.wait());
      console.log('brian', await api.contract.someMap('brian'));
      console.log('cv', await api.contract.changingValue());
      api.contract.on('TestEvent', (val) => {
        console.log('Test event emitted', val);
      });

      await api.contract.makeEvent('Yo!');
    }
  );
};
*/
