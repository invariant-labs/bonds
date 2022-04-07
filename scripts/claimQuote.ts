import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/lib/network'
import { ClaimQuote } from '@invariant-labs/bonds-sdk/lib/sale'
import { Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { clusterApiUrl, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const bondSalePub = new PublicKey('4xYUgeAZ5SzpXEY5n9wJoAswwMCthvfyJ1KcdcR3TVDB')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})
// @ts-expect-error
const wallet = provider.wallet.payer as Keypair

const connection = provider.connection

const claimQuote = async (bonds: Bonds) => {
  const tokenQuote = new Token(
    connection,
    new PublicKey(MOCK_TOKENS.USDC),
    TOKEN_PROGRAM_ID,
    MINTER
  )
  const payerQuoteAccount = await tokenQuote.createAccount(wallet.publicKey)

  const claimQuoteVars: ClaimQuote = {
    bondSale: bondSalePub,
    payerQuoteAccount,
    payer: wallet.publicKey
  }

  await bonds.claimQuote(claimQuoteVars, wallet)

  while (true) {
    if (!(await tokenQuote.getAccountInfo(payerQuoteAccount)).amount.eqn(0)) {
      break
    }
  }

  console.log((await tokenQuote.getAccountInfo(payerQuoteAccount)).amount.toString())
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await claimQuote(bonds)
}

main()
