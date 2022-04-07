export enum Network {
  LOCAL,
  DEV
}

export const getProgramAddress = (network: Network) => {
  switch (network) {
    case Network.LOCAL:
      return '2PAZiQGBhxQx45UsEcjn9iufTXZgrTD1q9ZdNBVR6YEc'
    case Network.DEV:
      return '2PAZiQGBhxQx45UsEcjn9iufTXZgrTD1q9ZdNBVR6YEc'
    default:
      throw new Error('Unknown network')
  }
}

export const MOCK_TOKENS = {
  INVT: '7419i15RMBxn6c4aETP8V2wrPd9C5kdCdk4inYDtph1i',
  USDC: '7AUnkVAWnkkh5Za3xLnSdgEuhs8SDuHuaqTAGErh44zc',
  USDT: 'UAA13oafJZkQv1LMZD8xShownp3QTqUhzyk5rWXm74f'
}
