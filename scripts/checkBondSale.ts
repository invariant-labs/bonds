import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { Provider } from '@project-serum/anchor'
import { clusterApiUrl, PublicKey } from '@solana/web3.js'

require('dotenv').config()

const bondSalePubEnd04April = new PublicKey('ABdmXApueWFhz1EzPPNr2EiJ4B8r3nqfKEtGgcXkSVuH')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const checkBondSale = async (bonds: Bonds) => {
  const bondSale = await bonds.getBondSale(bondSalePubEnd04April)
  console.log('supply: ', bondSale.supply.v.toString())
  console.log('previousPrice: ', bondSale.previousPrice.v.toString())
  console.log('lastTrade: ', bondSale.lastTrade.toString())
  console.log('quoteAmount: ', bondSale.quoteAmount.v.toString())
  console.log('remainingAmount: ', bondSale.remainingAmount.v.toString())
  console.log('startTime: ', bondSale.startTime.toString())
  console.log('endTime: ', bondSale.endTime.toString())
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await checkBondSale(bonds)
}

main()
