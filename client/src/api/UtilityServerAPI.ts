const WEBSERVER_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://zkga.me'
    : 'http://localhost:3000';
import * as EmailValidator from 'email-validator';
import { AddressTwitterMap } from '../_types/darkforest/api/UtilityServerAPITypes';
import { EthAddress } from '../_types/global/GlobalTypes';

export enum EmailResponse {
  Success,
  Invalid,
  ServerError,
}

export const submitInterestedEmail = async (
  email: string
): Promise<EmailResponse> => {
  if (!EmailValidator.validate(email)) {
    return EmailResponse.Invalid;
  }
  const { success } = await fetch(`${WEBSERVER_URL}/email/interested`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((x) => x.json());

  return success ? EmailResponse.Success : EmailResponse.ServerError;
};

export const submitPlayerEmail = async (
  email: string,
  ethAddress: EthAddress
): Promise<EmailResponse> => {
  if (!EmailValidator.validate(email)) {
    return EmailResponse.Invalid;
  }

  const { success } = await fetch(`${WEBSERVER_URL}/email/playing`, {
    method: 'POST',
    body: JSON.stringify({ email, address: ethAddress }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((x) => x.json());

  return success ? EmailResponse.Success : EmailResponse.ServerError;
};

export const submitWhitelistKey = async (
  key: string,
  address: EthAddress
): Promise<boolean> => {
  try {
    const { success } = await fetch(`${WEBSERVER_URL}/whitelist/register`, {
      method: 'POST',
      body: JSON.stringify({
        key,
        address,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((x) => x.json());

    return success;
  } catch (e) {
    console.error(`error when registering for whitelist: ${e}`);
    return false;
  }
};

export const isAddressWhitelisted = async (
  address: EthAddress
): Promise<boolean> => {
  try {
    const { whitelisted } = await fetch(
      `${WEBSERVER_URL}/whitelist/address/${address}/isWhitelisted`
    ).then((x) => x.json());
    return whitelisted;
  } catch (e) {
    console.log('Whitelist internal error, returning true.');
    console.error(e);
    return false;
  }
};

export const getAllTwitters = async (): Promise<AddressTwitterMap> => {
  try {
    const twitterMap: AddressTwitterMap = await fetch(
      `${WEBSERVER_URL}/twitter/all-twitters`
    ).then((x) => x.json());
    return twitterMap;
  } catch (e) {
    console.log('Error getting twitter handles.');
    console.error(e);
    return {};
  }
};

export const verifyTwitterHandle = async (
  twitter: string,
  address: EthAddress
): Promise<boolean> => {
  try {
    const { success } = await fetch(`${WEBSERVER_URL}/twitter/verify-twitter`, {
      method: 'POST',
      body: JSON.stringify({
        twitter,
        address,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((x) => x.json());

    return success;
  } catch (e) {
    console.error(`error when verifying twitter handle: ${e}`);
    return false;
  }
};
