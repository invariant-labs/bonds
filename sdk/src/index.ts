import { Sale } from './sale'

import { PublicKey, Transaction } from '@solana/web3.js'
import { getProgramAddress, Network } from './network'

export { Sale, Network, getProgramAddress }
export interface IWallet {
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
  publicKey: PublicKey
}
