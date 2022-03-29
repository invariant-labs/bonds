import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { calculateAmountToClaim } from '@invariant-labs/bonds-sdk/lib/math'
import { Provider } from '@project-serum/anchor'
import { clusterApiUrl, PublicKey } from '@solana/web3.js'

require('dotenv').config()

const bondSalePubEnd04April = new PublicKey('ABdmXApueWFhz1EzPPNr2EiJ4B8r3nqfKEtGgcXkSVuH')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const checkAllBonds = async (bonds: Bonds) => {
  const allBonds = await bonds.getAllBonds(bondSalePubEnd04April)

  for (const bond of allBonds) {
    console.log('amountToClaim: ', calculateAmountToClaim(bond).toString())
    console.log('bondAmount: ', bond.bondAmount.v.toString())
    console.log('lastClaim: ', bond.lastClaim.toString())
    console.log('vestingEnd: ', bond.vestingEnd.toString())
    console.log('\n')
  }
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await checkAllBonds(bonds)
}

main()
