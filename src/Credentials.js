/**
 * @flow
 */

import Api from './Api';

export type AndroidCredentials = {
  keystore: string,
  keystoreAlias: string,
  keystorePassword: string,
  keyPassword: string,
};

export type IOSCredentials = {
  appleId?: string,
  password?: string,
  teamId?: string,
  certP12?: string,
  certPassword?: string,
  pushP12?: string,
  pushPassword?: string,
  provisioningProfile?: string,
  enterpriseAccount?: string,
  // These are ids on the spaceship object (implementation detail), Spaceship::Portal::Certificate
  certId?: string,
  pushId?: string,
  provisioningProfileId?: string,
};

export type Credentials = IOSCredentials | AndroidCredentials;

export type CredentialMetadata = {
  username: string,
  experienceName: string,
  bundleIdentifier: string,
  platform: string,
};

export type CertObject = {
  userCredentialId: number,
  certId: string,
};

export type CertsList = Array<CertObject>;

export async function credentialsExistForPlatformAsync(
  metadata: CredentialMetadata
): Promise<?Credentials> {
  return fetchCredentials(metadata, false);
}

export async function getCredentialsForPlatform(
  metadata: CredentialMetadata
): Promise<?Credentials> {
  return fetchCredentials(metadata, true);
}

async function fetchCredentials(
  { username, experienceName, bundleIdentifier, platform }: CredentialMetadata,
  decrypt: boolean
): Promise<?Credentials> {
  // this doesn't hit our mac rpc channel, so it needs significantly less debugging
  const { err, credentials } = await Api.callMethodAsync('getCredentials', [], 'post', {
    username,
    experienceName,
    bundleIdentifier,
    platform,
    decrypt,
  });

  if (err) {
    throw new Error('Error fetching credentials.');
  }

  return credentials;
}

export async function updateCredentialsForPlatform(
  platform: string,
  newCredentials: Credentials,
  metadata: CredentialMetadata
): Promise<void> {
  // this doesn't go through the mac rpc, no request id needed
  const { err, credentials } = await Api.callMethodAsync('updateCredentials', [], 'post', {
    credentials: newCredentials,
    platform,
    ...metadata,
  });

  if (err || !credentials) {
    throw new Error('Error updating credentials.');
  }
}

export async function removeCredentialsForPlatform(
  platform: string,
  metadata: CredentialMetadata
): Promise<void> {
  // doesn't go through mac rpc, no request id needed
  const { err } = await Api.callMethodAsync('deleteCredentials', [], 'post', {
    platform,
    ...metadata,
  });

  if (err) {
    throw new Error('Error deleting credentials.');
  }
}

export async function getExistingDistCerts(
  username: string,
  appleTeamId: string
): Promise<?CertsList> {
  const { err, certs } = await Api.callMethodAsync('getExistingDistCerts', [], 'post', {
    username,
    appleTeamId,
  });

  if (err) {
    throw new Error('Error getting existing distribution certificates.');
  }

  return certs.map(({ usedByApps, ...rest }) => ({
    usedByApps: usedByApps && usedByApps.split(';'),
    ...rest,
  }));
}
