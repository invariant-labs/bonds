import { Bonds, Network } from '@invariant-labs/bonds-sdk/src'
import {
  calculateSellPrice,
  getCeilPrice,
  getPriceAfterSlippage
} from '@invariant-labs/bonds-sdk/src/math'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/src/network'
import { BondSaleStruct, BondStruct, CreateBond } from '@invariant-labs/bonds-sdk/src/sale'
import { toDecimal } from '@invariant-labs/bonds-sdk/src/utils'
import { BN, Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js'
import { assert } from 'chai'
import { MINTER } from './minter'

require('dotenv').config()

const bondSalePub = new PublicKey('4ns4t8Eot4sfSW6eNC3YEVhisjgaZWkzakduKFQbgUjB')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const buy = async (bonds: Bonds, buyer: Keypair, bondSalePub: PublicKey) => {
  const usdcToken = new Token(connection, new PublicKey(MOCK_TOKENS.USDC), TOKEN_PROGRAM_ID, MINTER)
  const buyerQuoteAccount = await usdcToken.createAccount(buyer.publicKey)

  await usdcToken.mintTo(buyerQuoteAccount, MINTER, [MINTER], 100_000)

  let bondSaleBefore: BondSaleStruct
  while (true) {
    try {
      bondSaleBefore = await bonds.getBondSale(bondSalePub)
      break
    } catch (error) {}
  }

  const priceSale = getPriceAfterSlippage(
    { v: calculateSellPrice(bondSaleBefore, new BN(6030)) },
    toDecimal(new BN(1), 1)
  )

  const amount = new BN(6030)
  const ceilPrice = getCeilPrice(bondSaleBefore.upBound, bondSaleBefore.floorPrice)
  const createBondVars: CreateBond = {
    amount,
    bondSale: bondSalePub,
    ownerQuoteAccount: buyerQuoteAccount,
    priceLimit: priceSale.gte(ceilPrice) ? ceilPrice : priceSale,
    owner: buyer.publicKey
  }

  const bondPubkey = await bonds.createBond(createBondVars, buyer)

  let bond: BondStruct
  while (true) {
    try {
      bond = await bonds.getBondByAddress(bondPubkey)
      break
    } catch (error) {}
  }

  let bondSaleAfter: BondSaleStruct
  while (true) {
    try {
      bondSaleAfter = await bonds.getBondSale(bondSalePub)
      break
    } catch (error) {}
  }

  const tokenBondDiff = bondSaleBefore.remainingAmount.v.sub(bondSaleAfter.remainingAmount.v)
  assert.ok(bond.bondAmount.v.eq(amount))
  assert.ok(bond.vestingEnd.sub(bond.vestingStart).eq(bondSaleAfter.vestingTime))
  assert.ok(tokenBondDiff.eq(amount))
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await buy(bonds, MINTER, bondSalePub)
}

main()
