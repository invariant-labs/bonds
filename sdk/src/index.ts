import { Bonds } from './sale'

import { PublicKey, Transaction } from '@solana/web3.js'
import { getProgramAddress, Network } from './network'

export { Bonds, Network, getProgramAddress }
export interface IWallet {
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
  publicKey: PublicKey
}
