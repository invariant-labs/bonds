import { Provider, BN } from '@project-serum/anchor'
import {
  Transaction,
  Keypair,
  Connection,
  ConfirmOptions,
  sendAndConfirmRawTransaction
} from '@solana/web3.js'
import { IWallet } from '.'
import { Decimal } from './sale'

export enum ERROR {
  ACCOUNT_NOT_EXISTS = 'Error: Account does not exist',
  CONSTRAINT_RAW = '0x7d3',
  PRICE_LIMIT_EXCEEDED = '0x1773'
}

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
  return await sendAndConfirmRawTransaction(connection, rawTx, opts ?? Provider.defaultOptions())
}

export const sleep = async (ms: number) => {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

export const toDecimal = (x: BN, decimals: number = 0): Decimal => {
  return { v: DENOMINATOR.mul(x).div(new BN(10).pow(new BN(decimals))) }
}

export const toScale = (num: BN, scale: number) => {
  return num.mul(new BN(10).pow(new BN(scale)))
}

export const bigNumberToBuffer = (n: BN, size: 16 | 32 | 64 | 128 | 256) => {
  const chunk = new BN(2).pow(new BN(16))

  const buffer = Buffer.alloc(size / 8)
  let offset = 0

  while (n.gt(new BN(0))) {
    buffer.writeUInt16LE(n.mod(chunk).toNumber(), offset)
    n = n.div(chunk)
    offset += 2
  }

  return buffer
}
