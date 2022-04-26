import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { Provider } from '@project-serum/anchor'
import { clusterApiUrl } from '@solana/web3.js'

require('dotenv').config()

const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const checkAllBondSales = async (bonds: Bonds) => {
  const bondSales = await bonds.getAllBondSales()

  for (const bondSale of bondSales) {
    console.log('supply: ', bondSale.account.supply.v.toString())
    console.log('previousPrice: ', bondSale.account.previousPrice.v.toString())
    console.log('lastTrade: ', bondSale.account.lastTrade.toString())
    console.log('quoteAmount: ', bondSale.account.quoteAmount.v.toString())
    console.log('remainingAmount: ', bondSale.account.remainingAmount.v.toString())
    console.log('feeAmount: ', bondSale.account.feeAmount.v.toString())
    console.log('startTime: ', bondSale.account.startTime.toString())
    console.log('endTime: ', bondSale.account.endTime.toString())
    console.log('upBound: ', bondSale.account.upBound.v.toString())
    console.log('velocity: ', bondSale.account.velocity.v.toString())
    console.log('fee: ', bondSale.account.fee.v.toString())
    console.log('vesting time: ', bondSale.account.vestingTime.toString())
    console.log('\n')
  }
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await checkAllBondSales(bonds)
}

main()
