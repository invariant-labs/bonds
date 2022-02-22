import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair } from '@solana/web3.js'
import { Network } from '@invariant-labs-bonds/sdk'
import { InitBondSale } from '@invariant-labs-bonds/sdk/lib/sale'
import { DENOMINATOR } from '@invariant-labs-bonds/sdk/lib/utils'
import { assert } from 'chai'
import { createToken } from './testUtils'
import { Bonds } from '@invariant-labs-bonds/sdk/lib/sale'

describe('init-bond-sale', () => {
  const provider = Provider.local()
  const connection = provider.connection

  // @ts-expect-error
  const wallet = provider.wallet.payer as Keypair
  const mintAuthority = Keypair.generate()
  const admin = Keypair.generate()
  const bondInitPayer = Keypair.generate()

  let sale: Bonds
  let tokenBond: Token
  let tokenQuote: Token

  before(async () => {
    sale = await Bonds.build(
      Network.LOCAL,
      provider.wallet,
      connection,
      anchor.workspace.Bonds.programId
    )

    await Promise.all([
      connection.requestAirdrop(mintAuthority.publicKey, 1e12),
      connection.requestAirdrop(admin.publicKey, 1e12),
      connection.requestAirdrop(wallet.publicKey, 1e12),
      connection.requestAirdrop(bondInitPayer.publicKey, 1e12)
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

  it('#initBondSale() wallet', async () => {
    const payerBondAccount = await tokenBond.createAccount(wallet.publicKey)
    const payerQuoteAccount = await tokenQuote.createAccount(wallet.publicKey)
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
      distribution: new BN(10)
    }

    const bondSalePubkey = await sale.initBondSale(initBondSaleVars)
    const bondSale = await sale.getBondSale(bondSalePubkey)

    assert.ok(
      bondSale.authority.toString() ===
        (await sale.getProgramAuthority()).programAuthority.toString()
    )
    assert.ok(bondSale.bondAmount.v.eqn(1000))
    assert.ok(bondSale.floorPrice.v.eq(DENOMINATOR))
    assert.ok(bondSale.payer.toString() === wallet.publicKey.toString())
    assert.ok(bondSale.quoteAmount.v.eqn(0))
    assert.ok(bondSale.remainingAmount.v.eqn(1000))
    assert.ok(bondSale.tokenBond.toString() === tokenBond.publicKey.toString())
    assert.ok(bondSale.tokenQuote.toString() === tokenQuote.publicKey.toString())
    assert.ok(bondSale.upBound.v.eq(new BN(500_000_000_000)))
    assert.ok(bondSale.velocity.v.eq(new BN(500_000_000_000)))
  })
})
