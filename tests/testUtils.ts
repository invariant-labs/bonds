import { TokenInstructions } from '@project-serum/serum'
import { Token } from '@solana/spl-token'
import { Connection, Keypair } from '@solana/web3.js'

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
