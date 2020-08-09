import _ from 'lodash';
import detectEthereumProvider from '@metamask/detect-provider';
import { providers } from 'ethers';
import { Network } from '@ethersproject/networks';
import { getProvider, getAddress } from '../utils/EthereumUtils';
import TerminalEmitter, { TerminalTextStyle } from '../utils/TerminalEmitter';
import { EthAddress } from '../_types/global/GlobalTypes';

export enum Incompatibility {
  NoIDB = 'no_idb',
  NoMetamaskInstalled = 'no_metamask_installed',
  NotRopsten = 'not_ropsten',
  MobileOrTablet = 'mobile_or_tablet',
  UnsupportedBrowser = 'unsupported_browser',
  NotLoggedInOrEnabled = 'not_logged_in_or_enabled',
  UnexpectedError = 'unexpected_error',
}

export const hasTouchscreen = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

const supportsIDB = () => {
  return 'indexedDB' in window;
};

// modified, original from https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
const _isMobile = () => {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a as string
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        (a as string).substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || 'opera' in window);
  return check;
};

// modified, original from https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
export const isMobileOrTablet = () => {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a as string
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        (a as string).substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || 'opera' in window);
  return check;
};

const getNetworkType = async (
  provider: providers.Web3Provider
): Promise<Network> => {
  return provider.getNetwork();
};

export const addAccountToBrowser = async (contractAddress: EthAddress) => {
  const existingAccounts = JSON.parse(
    window.localStorage[`${contractAddress}_owned_account`] || '[]'
  );
  window.localStorage[`${contractAddress}_owned_account`] = JSON.stringify(
    _.concat(existingAccounts, [await getAddress()])
  );
};

export const doesBrowserHaveAccountData = async (
  contractAddress: EthAddress
) => {
  return (
    `${contractAddress}_owned_account` in window.localStorage &&
    JSON.parse(
      window.localStorage[`${contractAddress}_owned_account`]
    ).includes(await getAddress())
  );
};

const isLoggedIntoMetamask = async () =>
  (await (await getProvider()).listAccounts()).length > 0;

const isRospten = async (provider: providers.Web3Provider) => {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  return (await getNetworkType(provider)).name === 'ropsten';
};

const isFirefox = () => navigator.userAgent.indexOf('Firefox') > 0;

const isChrome = () => /Google Inc/.test(navigator.vendor);

const isBrave = async () =>
  !!((navigator as any).brave && (await (navigator as any).brave.isBrave())); // eslint-disable-line @typescript-eslint/no-explicit-any

const isSupportedBrowser = async () =>
  isChrome() || isFirefox() || (await isBrave());

const isMetamaskInstalled = async () => {
  return !!(await detectEthereumProvider());
};

type FeatureList = Partial<Record<Incompatibility, boolean>>;

const checkFeatures = async (): Promise<FeatureList> => {
  const incompats = {};

  try {
    incompats[
      Incompatibility.UnsupportedBrowser
    ] = !(await isSupportedBrowser());
    incompats[Incompatibility.NoIDB] = !supportsIDB();
    incompats[Incompatibility.MobileOrTablet] = isMobileOrTablet();
    incompats[
      Incompatibility.NoMetamaskInstalled
    ] = !(await isMetamaskInstalled());

    if (incompats[Incompatibility.NoMetamaskInstalled]) {
      return incompats;
    }

    const provider = new providers.Web3Provider(await detectEthereumProvider());

    incompats[Incompatibility.NotRopsten] = !(await isRospten(provider));
    incompats[
      Incompatibility.NotLoggedInOrEnabled
    ] = !(await isLoggedIntoMetamask());
  } catch (e) {
    console.error(e);
    incompats[Incompatibility.UnexpectedError] = true;
  }

  return incompats;
};

export const enableEthereum = () => {
  try {
    return (window.ethereum as any).request({ method: 'eth_requestAccounts' }); // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch (e) {
    const terminalEmitter = TerminalEmitter.getInstance();
    terminalEmitter.println('Enable Ethereum failed.', TerminalTextStyle.Red);
    terminalEmitter.println(
      "This is a known issue for some Brave Browser users. If you're on Brave Browser, " +
        'disable the Brave crypto wallet by going to brave://settings, ' +
        'scrolling down to "Extensions", and selecting "MetaMask" as your Web3 Provider. ' +
        'Afterwards, refresh the page.'
    );
  }
};

export const unsupportedFeatures = async (): Promise<Incompatibility[]> => {
  const features = await checkFeatures();
  return _.keys(features).filter((f) => features[f]) as Incompatibility[];
};
