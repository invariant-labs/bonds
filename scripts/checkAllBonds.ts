import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { calculateAmountToClaim } from '@invariant-labs/bonds-sdk/lib/math'
import { Provider } from '@project-serum/anchor'
import { clusterApiUrl, PublicKey } from '@solana/web3.js'

require('dotenv').config()

const bondSalePub = new PublicKey('4xYUgeAZ5SzpXEY5n9wJoAswwMCthvfyJ1KcdcR3TVDB')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const checkAllBonds = async (bonds: Bonds) => {
  const allBonds = await bonds.getAllBonds(bondSalePub)

  for (const bond of allBonds) {
    console.log('amountToClaim: ', calculateAmountToClaim(bond.account).toString())
    console.log('bondAmount: ', bond.account.bondAmount.v.toString())
    console.log('lastClaim: ', bond.account.lastClaim.toString())
    console.log('vestingEnd: ', bond.account.vestingEnd.toString())
    console.log('\n')
  }
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await checkAllBonds(bonds)
}

main()
