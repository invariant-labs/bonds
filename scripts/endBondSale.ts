import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/lib/network'
import { EndBondSale } from '@invariant-labs/bonds-sdk/lib/sale'
import { Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const bondSalePub = new PublicKey('4ns4t8Eot4sfSW6eNC3YEVhisjgaZWkzakduKFQbgUjB')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

// @ts-expect-error
const wallet = provider.wallet.payer as Keypair
const connection = provider.connection

const endBondSale = async (bonds: Bonds, payer: Keypair) => {
  const invariantToken = new Token(
    connection,
    new PublicKey(MOCK_TOKENS.INVT),
    TOKEN_PROGRAM_ID,
    MINTER
  )
  const usdcToken = new Token(connection, new PublicKey(MOCK_TOKENS.USDC), TOKEN_PROGRAM_ID, MINTER)

  while (true) {
    try {
      await bonds.getBondSale(bondSalePub)
      break
    } catch (error) {}
  }

  const adminQuoteAccount = await usdcToken.createAccount(MINTER.publicKey)
  const payerBondAccount = await invariantToken.createAccount(payer.publicKey)
  const payerQuoteAccount = await usdcToken.createAccount(payer.publicKey)

  const endBondSaleVars: EndBondSale = {
    bondSale: bondSalePub,
    payerQuoteAccount,
    payerBondAccount,
    adminQuoteAccount,
    payer: payer.publicKey
  }

  await bonds.endBondSale(endBondSaleVars, payer)
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await endBondSale(bonds, wallet)
}

main()
