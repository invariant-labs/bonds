import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import {
  calculateSellPrice,
  getCeilPrice,
  getPriceAfterSlippage
} from '@invariant-labs/bonds-sdk/lib/math'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/lib/network'
import { CreateBond } from '@invariant-labs/bonds-sdk/lib/sale'
import { toDecimal } from '@invariant-labs/bonds-sdk/lib/utils'
import { BN, Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const bondSalePubEnd04April = new PublicKey('ABdmXApueWFhz1EzPPNr2EiJ4B8r3nqfKEtGgcXkSVuH')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const buy = async (bonds: Bonds, buyer: Keypair, bondSalePub: PublicKey) => {
  const usdcToken = new Token(connection, new PublicKey(MOCK_TOKENS.USDC), TOKEN_PROGRAM_ID, MINTER)
  const buyerQuoteAccount = await usdcToken.createAccount(buyer.publicKey)

  await usdcToken.mintTo(buyerQuoteAccount, MINTER, [MINTER], 100_000)

  const bondSale = await bonds.getBondSale(bondSalePubEnd04April)
  const priceSale = getPriceAfterSlippage(
    { v: calculateSellPrice(bondSale, new BN(6030)) },
    toDecimal(new BN(1), 1)
  )
  console.log('priceSale: ', priceSale.toString())
  const ceilPrice = getCeilPrice(bondSale.upBound, bondSale.floorPrice)
  const createBondVars: CreateBond = {
    amount: new BN(6030),
    bondSale: bondSalePub,
    ownerQuoteAccount: buyerQuoteAccount,
    priceLimit: priceSale.gte(ceilPrice) ? ceilPrice : priceSale,
    owner: buyer.publicKey
  }

  await bonds.createBond(createBondVars, buyer)
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await buy(bonds, MINTER, bondSalePubEnd04April)
}

main()
