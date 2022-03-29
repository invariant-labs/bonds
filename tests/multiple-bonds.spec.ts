import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Network } from '@invariant-labs/bonds-sdk'
import { CreateBond, InitBondSale } from '@invariant-labs/bonds-sdk/lib/sale'
import { DENOMINATOR, sleep, toDecimal } from '@invariant-labs/bonds-sdk/lib/utils'
import { assert } from 'chai'
import { almostEqual, createToken } from './testUtils'
import { Bonds } from '@invariant-labs/bonds-sdk/src'
import { getPriceAfterSlippage } from '@invariant-labs/bonds-sdk/lib/math'

describe('multiple-bonds', () => {
  const provider = Provider.local()
  const connection = provider.connection

  // @ts-expect-error
  const wallet = provider.wallet.payer as Keypair
  const mintAuthority = Keypair.generate()
  const admin = Keypair.generate()
  const bondInitPayer = Keypair.generate()
  const bondOwner = Keypair.generate()

  let bonds: Bonds
  let tokenBond: Token
  let tokenQuote: Token
  let bondSalePubkey: PublicKey

  before(async () => {
    bonds = await Bonds.build(
      Network.LOCAL,
      provider.wallet,
      connection,
      anchor.workspace.Bonds.programId
    )

    await Promise.all([
      connection.requestAirdrop(mintAuthority.publicKey, 1e12),
      connection.requestAirdrop(admin.publicKey, 1e12),
      connection.requestAirdrop(wallet.publicKey, 1e12),
      connection.requestAirdrop(bondInitPayer.publicKey, 1e12),
      connection.requestAirdrop(bondOwner.publicKey, 1e12)
    ])

    const tokens = await Promise.all([
      createToken(connection, wallet, mintAuthority),
      createToken(connection, wallet, mintAuthority)
    ])

    tokenBond = new Token(connection, tokens[0].publicKey, TOKEN_PROGRAM_ID, wallet)
    tokenQuote = new Token(connection, tokens[1].publicKey, TOKEN_PROGRAM_ID, wallet)
  })

  describe('user', () => {
    it('#initBondSale()', async () => {
      const payerBondAccount = await tokenBond.createAccount(bondInitPayer.publicKey)
      const payerQuoteAccount = await tokenQuote.createAccount(bondInitPayer.publicKey)
      await tokenBond.mintTo(payerBondAccount, mintAuthority, [mintAuthority], 1000)

      const initBondSaleVars: InitBondSale = {
        supply: new BN(1000),
        duration: new BN(100),
        floorPrice: DENOMINATOR,
        payerBondAccount,
        payerQuoteAccount,
        tokenBond,
        tokenQuote,
        upBound: DENOMINATOR.divn(2),
        velocity: DENOMINATOR.divn(2),
        payer: bondInitPayer.publicKey,
        vestingTime: new BN(10)
      }
      bondSalePubkey = await bonds.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#createBonds()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(bondOwner.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)

      const bondSale = await bonds.getBondSale(bondSalePubkey)
      const createBondVars: CreateBond = {
        amount: new BN(100),
        priceLimit: getPriceAfterSlippage(bondSale.previousPrice, toDecimal(new BN(1), 1)),
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }

      const bondPub = await bonds.createBond(createBondVars, bondOwner)
      const bond = await bonds.getBond(bondPub)
      assert.ok(bond.bondAmount.v.eqn(100))
      assert.ok(bond.owner.toString() === bondOwner.publicKey.toString())
      assert.ok((await tokenQuote.getAccountInfo(ownerQuoteAccount)).amount.eqn(897))

      await sleep(500)

      const bondSale2 = await bonds.getBondSale(bondSalePubkey)
      const createBondVars2: CreateBond = {
        amount: new BN(50),
        priceLimit: getPriceAfterSlippage(bondSale2.previousPrice, toDecimal(new BN(1), 1)),
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }

      const bondPub2 = await bonds.createBond(createBondVars2, bondOwner)
      const bond2 = await bonds.getBond(bondPub2)
      assert.ok(bond2.bondAmount.v.eqn(50))
      assert.ok(bond2.owner.toString() === bondOwner.publicKey.toString())
      assert.ok(
        almostEqual(
          (await tokenQuote.getAccountInfo(ownerQuoteAccount)).amount,
          new BN(844),
          new BN(1)
        )
      )

      await sleep(3000)

      const bondSale3 = await bonds.getBondSale(bondSalePubkey)
      const createBondVars3: CreateBond = {
        amount: new BN(111),
        priceLimit: getPriceAfterSlippage(bondSale3.previousPrice, toDecimal(new BN(1), 1)),
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }
      const bondPub3 = await bonds.createBond(createBondVars3, bondOwner)
      const bond3 = await bonds.getBond(bondPub3)
      assert.ok(bond3.bondAmount.v.eqn(111))
      assert.ok(bond3.owner.toString() === bondOwner.publicKey.toString())
      assert.ok(
        almostEqual(
          (await tokenQuote.getAccountInfo(ownerQuoteAccount)).amount,
          new BN(722),
          new BN(2)
        )
      )
    })
  })
})
