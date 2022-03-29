export enum Network {
  LOCAL,
  DEV
}

export const getProgramAddress = (network: Network) => {
  switch (network) {
    case Network.LOCAL:
      return 'A8jXJ4XTwjTo4yPoAWu8iiHHvoCM8c91NWBcjKsc886g'
    case Network.DEV:
      return 'A8jXJ4XTwjTo4yPoAWu8iiHHvoCM8c91NWBcjKsc886g'
    default:
      throw new Error('Unknown network')
  }
}

export const MOCK_TOKENS = {
  INVT: '7419i15RMBxn6c4aETP8V2wrPd9C5kdCdk4inYDtph1i',
  USDC: '7AUnkVAWnkkh5Za3xLnSdgEuhs8SDuHuaqTAGErh44zc',
  USDT: 'UAA13oafJZkQv1LMZD8xShownp3QTqUhzyk5rWXm74f'
}
