import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair } from '@solana/web3.js'
import { Sale, Network } from '@template-labs/sdk'
import { InitBondSale } from '@template-labs/sdk/lib/sale'
import { DENOMINATOR } from '@template-labs/sdk/lib/utils'
import { assert } from 'chai'
import { createToken } from './testUtils'

describe('init-bond-sale', () => {
  const provider = Provider.local()
  const connection = provider.connection

  // @ts-expect-error
  const wallet = provider.wallet.payer as Keypair
  const mintAuthority = Keypair.generate()
  const admin = Keypair.generate()
  const bondInitPayer = Keypair.generate()

  let sale: Sale
  let tokenBond: Token
  let tokenQuote: Token

  before(async () => {
    sale = await Sale.build(
      Network.LOCAL,
      provider.wallet,
      connection,
      anchor.workspace.Bonds.programId
    )

    await Promise.all([
      await connection.requestAirdrop(mintAuthority.publicKey, 1e12),
      await connection.requestAirdrop(admin.publicKey, 1e12),
      await connection.requestAirdrop(wallet.publicKey, 1e12),
      await connection.requestAirdrop(bondInitPayer.publicKey, 1e12)
    ])

    const tokens = await Promise.all([
      createToken(connection, wallet, mintAuthority),
      createToken(connection, wallet, mintAuthority)
    ])

    tokenBond = new Token(connection, tokens[0].publicKey, TOKEN_PROGRAM_ID, wallet)
    tokenQuote = new Token(connection, tokens[1].publicKey, TOKEN_PROGRAM_ID, wallet)
  })

  it('#initBondSale()', async () => {
    const payerBondAccount = await tokenBond.createAccount(bondInitPayer.publicKey)
    const payerQuoteAccount = await tokenQuote.createAccount(bondInitPayer.publicKey)
    await tokenBond.mintTo(payerBondAccount, mintAuthority, [mintAuthority], 1000)

    const initBondSaleVars: InitBondSale = {
      buyAmount: new BN(1000),
      duration: new BN(100),
      floorPrice: DENOMINATOR,
      payerBondAccount,
      payerQuoteAccount,
      tokenBond,
      tokenQuote,
      upBound: DENOMINATOR.divn(2),
      velocity: DENOMINATOR.divn(2),
      payer: bondInitPayer.publicKey,
      distribution: new BN(10)
    }

    const bondSalePubkey = await sale.initBondSale(initBondSaleVars, bondInitPayer)
    const bondSale = await sale.getBondSale(bondSalePubkey)

    assert.ok(
      bondSale.authority.toString() ===
        (await sale.getProgramAuthority()).programAuthority.toString()
    )
    assert.ok(bondSale.bondAmount.v.eqn(1000))
    assert.ok(bondSale.floorPrice.v.eq(DENOMINATOR))
    assert.ok(bondSale.payer.toString() === bondInitPayer.publicKey.toString())
    assert.ok(bondSale.quoteAmount.v.eqn(0))
    assert.ok(bondSale.remainingAmount.v.eqn(1000))
    assert.ok(bondSale.tokenBond.toString() === tokenBond.publicKey.toString())
    assert.ok(bondSale.tokenQuote.toString() === tokenQuote.publicKey.toString())
    assert.ok(bondSale.upBound.v.eq(new BN(500_000_000_000)))
    assert.ok(bondSale.velocity.v.eq(new BN(500_000_000_000)))
  })
})
