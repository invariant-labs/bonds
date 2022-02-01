import { TokenInstructions } from '@project-serum/serum'
import { Token } from '@solana/spl-token'
import { Connection, Keypair } from '@solana/web3.js'

export enum ERROR {
  ACCOUNT_NOT_EXISTS = 'Error: Account does not exist'
}

export const createToken = async (
  connection: Connection,
  payer: Keypair,
  mintAuthority: Keypair,
  decimals = 6
) => {
  const token = await Token.createMint(
    connection,
    payer,
    mintAuthority.publicKey,
    null,
    decimals,
    TokenInstructions.TOKEN_PROGRAM_ID
  )
  return token
}

export async function assertThrowsAsync(fn: Promise<any>, word?: string) {
  try {
    await fn
  } catch (e: any) {
    let err
    if (e.code) {
      err = '0x' + e.code.toString(16)
    } else {
      err = e.toString()
    }
    console.log(err)
    if (word) {
      const regex = new RegExp(word)
      console.log(regex.test(err))
      if (!regex.test(err)) {
        console.log(err)
        throw new Error('Invalid Error message')
      }
    }
    return
  }
  throw new Error('Function did not throw error')
}
