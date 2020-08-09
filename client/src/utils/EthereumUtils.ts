import detectEthereumProvider from '@metamask/detect-provider';
import { providers } from 'ethers';
import { address } from './CheckedTypeUtils';

export const getProvider = async () =>
  new providers.Web3Provider(await detectEthereumProvider());

export const getAddress = async () =>
  address(await (await getProvider()).getSigner().getAddress());

const onEthereumConfigChange = () => {
  location.reload();
};

export const handleEthereumConfigChanges = () => {
  if (!window.ethereum) {
    return () => {};
  }
  const onAccountChange = (_accounts: Array<string>) => {
    onEthereumConfigChange();
  };

  const onChainChange = (_chainId: string) => {
    onEthereumConfigChange();
  };

  window.ethereum.on('accountsChanged', onAccountChange);
  window.ethereum.on('chainChanged', onChainChange);

  return () => {
    window.ethereum.removeListener('accountsChanged', onAccountChange);
    window.ethereum.removeListener('chainChanged', onChainChange);
  };
};
