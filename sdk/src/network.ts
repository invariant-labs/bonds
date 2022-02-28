export enum Network {
  LOCAL,
  DEV
}

export const getProgramAddress = (network: Network) => {
  switch (network) {
    case Network.LOCAL:
      return 'R9PatsTac3Y3UpC7ihYMMgzAQCe1tXnVvkSQ8DtLWUc'
    case Network.DEV:
      return 'R9PatsTac3Y3UpC7ihYMMgzAQCe1tXnVvkSQ8DtLWUc'
    default:
      throw new Error('Unknown network')
  }
}

export const MOCK_TOKENS = {
  INVT: '7419i15RMBxn6c4aETP8V2wrPd9C5kdCdk4inYDtph1i',
  USDC: '7AUnkVAWnkkh5Za3xLnSdgEuhs8SDuHuaqTAGErh44zc',
  USDT: 'UAA13oafJZkQv1LMZD8xShownp3QTqUhzyk5rWXm74f'
}
