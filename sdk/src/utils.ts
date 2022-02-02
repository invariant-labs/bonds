import { Provider, BN } from '@project-serum/anchor'
import {
  Transaction,
  Keypair,
  Connection,
  ConfirmOptions,
  sendAndConfirmRawTransaction
} from '@solana/web3.js'
import { IWallet } from '.'

export const DECIMAL = 12
export const DENOMINATOR = new BN(10).pow(new BN(DECIMAL))

export const signAndSend = async (
  tx: Transaction,
  signers: Keypair[],
  connection: Connection,
  opts?: ConfirmOptions
) => {
  tx.setSigners(...signers.map(s => s.publicKey))
  const blockhash = await connection.getRecentBlockhash(
    opts?.commitment || Provider.defaultOptions().commitment
  )
  tx.recentBlockhash = blockhash.blockhash
  tx.partialSign(...signers)
  const rawTx = tx.serialize()
  return await sendAndConfirmRawTransaction(connection, rawTx, opts || Provider.defaultOptions())
}
export const sleep = async (ms: number) => {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

export const signAndSendWallet = async (
  wallet: IWallet,
  tx: Transaction,
  connection: Connection,
  signers?: Keypair[],
  opts?: ConfirmOptions
) => {
  const blockhash = await connection.getRecentBlockhash(
    opts?.commitment || Provider.defaultOptions().commitment
  )
  tx.recentBlockhash = blockhash.blockhash
  tx = await wallet.signTransaction(tx)
  if (signers !== undefined) {
    tx.partialSign(...signers)
  }
  const rawTx = tx.serialize()
  return await sendAndConfirmRawTransaction(connection, rawTx, opts || Provider.defaultOptions())
}
