import { Listener, TransactionReceipt } from '@ethersproject/providers';

export interface AbstractContract {
  readonly address: string;

  on(event: string, listener: Listener): AbstractContract;
  removeAllListeners(eventName: string): AbstractContract;

  // AbstractContracts must forward arbitararily named functions to their underlying contracts.
  // However, we want to be able to access non-function properties with this.*, so we can't use [name: string]: Function.

  [name: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface AbstractSigner {
  getAddress(): Promise<string>;
  signMessage(message: string): Promise<string>;
}

export interface AbstractProvider {
  waitForTransaction(txHash: string): Promise<TransactionReceipt>;
}
