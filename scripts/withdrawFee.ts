import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/lib/network'
import { WithdrawFee } from '@invariant-labs/bonds-sdk/lib/sale'
import { Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { clusterApiUrl, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

const bondSalePub = new PublicKey('4xYUgeAZ5SzpXEY5n9wJoAswwMCthvfyJ1KcdcR3TVDB')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const withdrawFee = async (bonds: Bonds) => {
  const tokenQuote = new Token(
    connection,
    new PublicKey(MOCK_TOKENS.USDC),
    TOKEN_PROGRAM_ID,
    MINTER
  )
  const adminQuoteAccount = await tokenQuote.createAccount(MINTER.publicKey)

  const withdrawFeeVars: WithdrawFee = {
    bondSale: bondSalePub,
    adminQuoteAccount,
    admin: MINTER.publicKey
  }

  await bonds.withdrawFee(withdrawFeeVars, MINTER)

  while (true) {
    if (!(await tokenQuote.getAccountInfo(adminQuoteAccount)).amount.eqn(0)) {
      break
    }
  }

  console.log((await tokenQuote.getAccountInfo(adminQuoteAccount)).amount.toString())
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await withdrawFee(bonds)
}

main()
