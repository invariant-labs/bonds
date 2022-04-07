import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { MOCK_TOKENS } from '@invariant-labs/bonds-sdk/lib/network'
import { ClaimBond } from '@invariant-labs/bonds-sdk/lib/sale'
import { BN, Provider } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { clusterApiUrl, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const bondSalePub = new PublicKey('4xYUgeAZ5SzpXEY5n9wJoAswwMCthvfyJ1KcdcR3TVDB')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection

const claimBond = async (bonds: Bonds) => {
  const bondToken = new Token(connection, new PublicKey(MOCK_TOKENS.INVT), TOKEN_PROGRAM_ID, MINTER)
  const ownerBondAccount = await bondToken.createAccount(MINTER.publicKey)

  const claimBondVars: ClaimBond = {
    bondSale: bondSalePub,
    ownerBondAccount,
    owner: MINTER.publicKey,
    bondId: new BN(1)
  }
  await bonds.claimBond(claimBondVars, MINTER)

  while (true) {
    if (!(await bondToken.getAccountInfo(ownerBondAccount)).amount.eqn(0)) {
      break
    }
  }
  console.log(
    'amountClaimed: ',
    (await bondToken.getAccountInfo(ownerBondAccount)).amount.toString()
  )
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await claimBond(bonds)
}

main()
