import { Network, Bonds } from '@invariant-labs/bonds-sdk'
import { ChangeFee, ChangeUpBound, ChangeVelocity } from '@invariant-labs/bonds-sdk/lib/sale'
import { BN, Provider } from '@project-serum/anchor'
import { clusterApiUrl, PublicKey } from '@solana/web3.js'
import { MINTER } from './minter'

require('dotenv').config()

const bondSalePub = new PublicKey('4xYUgeAZ5SzpXEY5n9wJoAswwMCthvfyJ1KcdcR3TVDB')
const provider = Provider.local(clusterApiUrl('devnet'), {
  skipPreflight: true
})

const connection = provider.connection
// @ts-expect-error
const wallet = provider.wallet.payer as Keypair

interface Params {
  upBound?: BN
  velocity?: BN
  fee?: BN
}

const changeParams = async (bonds: Bonds, params: Params) => {
  if (params.upBound) {
    const changeUpBoundVars: ChangeUpBound = {
      bondSale: bondSalePub,
      upBound: params.upBound,
      payer: wallet.publicKey
    }

    await bonds.changeUpBound(changeUpBoundVars, wallet)
  }

  if (params.velocity) {
    const changeVelocityVars: ChangeVelocity = {
      bondSale: bondSalePub,
      velocity: params.velocity,
      payer: wallet.publicKey
    }

    await bonds.changeVelocity(changeVelocityVars, wallet)
  }

  if (params.fee) {
    const changeFeeVars: ChangeFee = {
      bondSale: bondSalePub,
      newFee: params.fee,
      admin: MINTER.publicKey
    }

    await bonds.changeFee(changeFeeVars, MINTER)
  }
}

const main = async () => {
  const bonds = await Bonds.build(Network.DEV, provider.wallet, connection)
  await changeParams(bonds, {
    upBound: new BN(10),
    velocity: new BN(10),
    fee: new BN(1)
  })
}

main()
