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

  const solToken = await createToken(connection, wallet, MINTER, 6)
  const snyToken = await createToken(connection, wallet, MINTER, 6)
  const hawksightToken = await createToken(connection, wallet, MINTER, 6)

  console.log(`SOL: ${solToken.publicKey.toString()}`)
  console.log(`SNY: ${snyToken.publicKey.toString()}`)
  console.log(`HAWK: ${hawksightToken.publicKey.toString()}`)
}

main()
