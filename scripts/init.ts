import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/lib/network'
import { InitBondSale } from '@invariant-labs/bonds-sdk/lib/sale'
import { toDecimal } from '@invariant-labs/bonds-sdk/lib/utils'
import { BN, Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const provider = Provider.local('https://api.devnet.solana.com', {
  skipPreflight: true
})

const connection = provider.connection

const initBondSale = async (bonds: Bonds, payer: Keypair) => {
  const invariantToken = new Token(
    connection,
    new PublicKey(MOCK_TOKENS.INVT),
    TOKEN_PROGRAM_ID,
    MINTER
  )
  console.log('11111111111111')
  const usdcToken = new Token(connection, new PublicKey(MOCK_TOKENS.USDC), TOKEN_PROGRAM_ID, MINTER)
  console.log('11111111111111')
  const payerBondAccount = await invariantToken.createAccount(payer.publicKey)
  console.log('11111111111111')
  const payerQuoteAccount = await usdcToken.createAccount(payer.publicKey)
  console.log('11111111111111')
  await invariantToken.mintTo(payerBondAccount, MINTER, [MINTER], 10_000_000)
  console.log('11111111111111')
  const initBondSaleVars: InitBondSale = {
    velocity: toDecimal(1, 0).v,
    upBound: toDecimal(15, 1).v,
    floorPrice: toDecimal(3, 0).v,
    duration: new BN(604_800),
    distribution: new BN(1_814_400),
    buyAmount: new BN(10_000_000),
    tokenBond: invariantToken,
    tokenQuote: usdcToken,
    payerBondAccount,
    payerQuoteAccount,
    payer: payer.publicKey
  }

  await bonds.initBondSale(initBondSaleVars, payer)
  console.log('11111111111111')
}

const main = async () => {
  console.log('11111111111111')
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  console.log('11111111111111')
  await initBondSale(bonds, MINTER)
}

main()
