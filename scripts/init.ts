import { Bonds, Network } from '@invariant-labs/bonds-sdk/src'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/src/network'
import { InitBondSale } from '@invariant-labs/bonds-sdk/src/sale'
import { toDecimal } from '@invariant-labs/bonds-sdk/src/utils'
import { BN, Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection
// @ts-expect-error
const wallet = provider.wallet.payer as Keypair

const initBondSale = async (bonds: Bonds, payer: Keypair) => {
  const invariantToken = new Token(
    connection,
    new PublicKey(MOCK_TOKENS.HAWK),
    TOKEN_PROGRAM_ID,
    MINTER
  )
  const usdcToken = new Token(connection, new PublicKey(MOCK_TOKENS.SOL), TOKEN_PROGRAM_ID, MINTER)

  const payerBondAccount = await invariantToken.createAccount(payer.publicKey)

  await invariantToken.mintTo(payerBondAccount, MINTER, [MINTER], 2_500_000)

  const initBondSaleVars: InitBondSale = {
    velocity: toDecimal(new BN(12), 1).v,
    upBound: toDecimal(new BN(30), 1).v,
    floorPrice: toDecimal(new BN(5), 2).v,
    duration: new BN(1_209_600),
    vestingTime: new BN(1_209_600),
    supply: new BN(2_500_000),
    tokenBond: invariantToken,
    tokenQuote: usdcToken,
    payerBondAccount,
    payer: payer.publicKey
  }

  const bondSalePub = await bonds.initBondSale(initBondSaleVars, payer)
  console.log(bondSalePub.toString())
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await initBondSale(bonds, wallet)
}

main()
