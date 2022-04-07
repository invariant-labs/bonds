import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { Provider } from '@project-serum/anchor'
import { clusterApiUrl, PublicKey } from '@solana/web3.js'

require('dotenv').config()

const bondSalePub = new PublicKey('4xYUgeAZ5SzpXEY5n9wJoAswwMCthvfyJ1KcdcR3TVDB')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const checkBondSale = async (bonds: Bonds) => {
  const bondSale = await bonds.getBondSale(bondSalePub)
  console.log('supply: ', bondSale.supply.v.toString())
  console.log('previousPrice: ', bondSale.previousPrice.v.toString())
  console.log('lastTrade: ', bondSale.lastTrade.toString())
  console.log('quoteAmount: ', bondSale.quoteAmount.v.toString())
  console.log('remainingAmount: ', bondSale.remainingAmount.v.toString())
  console.log('feeAmount: ', bondSale.feeAmount.v.toString())
  console.log('startTime: ', bondSale.startTime.toString())
  console.log('endTime: ', bondSale.endTime.toString())
  console.log('upBound: ', bondSale.upBound.v.toString())
  console.log('velocity: ', bondSale.velocity.v.toString())
  console.log('fee: ', bondSale.fee.v.toString())
  console.log('\n')
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await checkBondSale(bonds)
}

main()
