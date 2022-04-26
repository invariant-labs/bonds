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
  USDT: 'UAA13oafJZkQv1LMZD8xShownp3QTqUhzyk5rWXm74f',
  SOL: 'AHHQ4K1vHH5Bw6t1XQoEN2PqitS9tKALR38Vg8zMor24',
  SNY: 'HNyfcBMk7bW5VRw6yyE1tJyrvicy5f1PMWWyU4awYqrZ',
  HAWK: 'CXNnEXnzenBoBg2gArf4AQyoPX7AT4tSz5xmE4rm6U9X'
}
