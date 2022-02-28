import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/lib/network'
import { CreateBond } from '@invariant-labs/bonds-sdk/lib/sale'
import { toDecimal } from '@invariant-labs/bonds-sdk/lib/utils'
import { BN, Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const bondSalePub = new PublicKey('')
const provider = Provider.local('https://api.devnet.solana.com', {
  skipPreflight: true
})

const connection = provider.connection

const buy = async (bonds: Bonds, buyer: Keypair, bondSalePub: PublicKey) => {
  const usdcToken = new Token(connection, new PublicKey(MOCK_TOKENS.USDC), TOKEN_PROGRAM_ID, MINTER)

  const buyerQuoteAccount = await usdcToken.createAccount(buyer.publicKey)

  await usdcToken.mintTo(buyerQuoteAccount, MINTER, [MINTER], 10_000)

  const createBondVars: CreateBond = {
    amount: new BN(2000),
    bondSale: bondSalePub,
    ownerQuoteAccount: buyerQuoteAccount,
    priceLimit: toDecimal(1, 1).v,
    owner: buyer.publicKey
  }

  await bonds.createBond(createBondVars, buyer)
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await buy(bonds, MINTER, bondSalePub)
}

main()
