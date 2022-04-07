import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { Provider } from '@project-serum/anchor'
import { clusterApiUrl } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const createState = async (bonds: Bonds) => {
  await bonds.createState(MINTER.publicKey, MINTER)
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await createState(bonds)
}

main()
