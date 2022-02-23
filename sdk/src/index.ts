import { PublicKey, Transaction } from '@solana/web3.js'
import { getProgramAddress, Network } from './network'
import { Bonds } from './sale'

export { Network, getProgramAddress, Bonds }
export interface IWallet {
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
  publicKey: PublicKey
}
