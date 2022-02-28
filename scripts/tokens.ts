import { Provider } from '@project-serum/anchor'
import { Keypair } from '@solana/web3.js'
import { createToken } from '../tests/testUtils'
import { MINTER } from './minter'

require('dotenv').config()

const provider = Provider.local('https://api.devnet.solana.com', {
  // preflightCommitment: 'max',
  skipPreflight: true
})

const main = async () => {
  const connection = provider.connection
  // @ts-expect-error
  const wallet = provider.wallet.payer as Keypair

  const invariantToken = await createToken(connection, wallet, MINTER, 6)
  const usdcToken = await createToken(connection, wallet, MINTER, 6)
  const usdtToken = await createToken(connection, wallet, MINTER, 6)

  console.log(`INVT: ${invariantToken.publicKey.toString()}`)
  console.log(`USDC: ${usdcToken.publicKey.toString()}`)
  console.log(`USDT: ${usdtToken.publicKey.toString()}`)
}

main()
