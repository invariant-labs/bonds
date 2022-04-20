export enum Network {
  LOCAL,
  DEV
}

export const getProgramAddress = (network: Network) => {
  switch (network) {
    case Network.LOCAL:
      return 'DojjMwd2tErELy9vuLs7Jb6JW7FBJEh4f25wibHp3HCm'
    case Network.DEV:
      return 'DojjMwd2tErELy9vuLs7Jb6JW7FBJEh4f25wibHp3HCm'
    default:
      throw new Error('Unknown network')
  }
}

export const MOCK_TOKENS = {
  INVT: '7419i15RMBxn6c4aETP8V2wrPd9C5kdCdk4inYDtph1i',
  USDC: '7AUnkVAWnkkh5Za3xLnSdgEuhs8SDuHuaqTAGErh44zc',
  USDT: 'UAA13oafJZkQv1LMZD8xShownp3QTqUhzyk5rWXm74f'
}
