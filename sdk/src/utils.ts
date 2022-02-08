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
  connection: Connection,
  signers?: Keypair[],
  wallet?: IWallet,
  opts?: ConfirmOptions
) => {
  if (signers === undefined && wallet === undefined) {
    throw new Error('Either signers or wallet should be defined')
  }

  const blockhash = await connection.getRecentBlockhash(
    opts?.commitment || Provider.defaultOptions().commitment
  )
  tx.recentBlockhash = blockhash.blockhash

  if (signers !== undefined) {
    tx.setSigners(...signers.map(s => s.publicKey))
    tx.partialSign(...signers)
  }
  if (wallet !== undefined) {
    tx.feePayer = wallet.publicKey
    tx = await wallet.signTransaction(tx)
  }

  const rawTx = tx.serialize()
  return await sendAndConfirmRawTransaction(connection, rawTx, opts || Provider.defaultOptions())
}

export const sleep = async (ms: number) => {
  return await new Promise(resolve => setTimeout(resolve, ms))
}
