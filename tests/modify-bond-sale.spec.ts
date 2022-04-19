import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Network } from '@invariant-labs/bonds-sdk'
import { ChangeUpBound, ChangeVelocity, InitBondSale } from '@invariant-labs/bonds-sdk/lib/sale'
import { DENOMINATOR, ERROR } from '@invariant-labs/bonds-sdk/lib/utils'
import { assert } from 'chai'
import { assertThrowsAsync, createToken } from './testUtils'
import { Bonds } from '@invariant-labs/bonds-sdk/src'

describe('modify-bond-sale', () => {
  const provider = Provider.local()
  const connection = provider.connection

  // @ts-expect-error
  const wallet = provider.wallet.payer as Keypair
  const mintAuthority = Keypair.generate()
  const admin = Keypair.generate()
  const bondInitPayer = Keypair.generate()

  let bondSalePubkey: PublicKey
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

    await sale.createState(admin.publicKey, admin)
  })

  describe('initBondPayer', () => {
    it('#initBondSale()', async () => {
      const payerBondAccount = await tokenBond.createAccount(bondInitPayer.publicKey)
      const payerQuoteAccount = await tokenQuote.createAccount(bondInitPayer.publicKey)
      await tokenBond.mintTo(payerBondAccount, mintAuthority, [mintAuthority], 1000)

      const initBondSaleVars: InitBondSale = {
        supply: new BN(1000),
        duration: new BN(100),
        floorPrice: DENOMINATOR,
        payerBondAccount,
        tokenBond,
        tokenQuote,
        upBound: DENOMINATOR.divn(2),
        velocity: DENOMINATOR.divn(2),
        payer: bondInitPayer.publicKey,
        vestingTime: new BN(10)
      }

      bondSalePubkey = await sale.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#changeVelocity()', async () => {
      const newVelocity = DENOMINATOR.divn(3)
      const changeVelocityVars: ChangeVelocity = {
        bondSale: bondSalePubkey,
        velocity: newVelocity,
        payer: bondInitPayer.publicKey
      }

      await sale.changeVelocity(changeVelocityVars, bondInitPayer)

      const bondSale = await sale.getBondSale(bondSalePubkey)
      assert.ok(bondSale.velocity.v.eq(new BN(DENOMINATOR.divn(3))))
    })

    it('#changeVelocity() wrong payer', async () => {
      const newVelocity = DENOMINATOR.divn(3)
      const changeVelocityVars: ChangeVelocity = {
        bondSale: bondSalePubkey,
        velocity: newVelocity,
        payer: admin.publicKey
      }

      await assertThrowsAsync(sale.changeVelocity(changeVelocityVars, admin), ERROR.CONSTRAINT_RAW)
    })

    it('changeUpBound()', async () => {
      const newUpBound = DENOMINATOR.divn(3)
      const changeUpBoundVars: ChangeUpBound = {
        bondSale: bondSalePubkey,
        upBound: newUpBound,
        payer: bondInitPayer.publicKey
      }

      await sale.changeUpBound(changeUpBoundVars, bondInitPayer)
      const bondSale = await sale.getBondSale(bondSalePubkey)
      assert.ok(bondSale.upBound.v.eq(new BN(DENOMINATOR.divn(3))))
    })

    it('#changeUpBound() wrong payer', async () => {
      const newUpBound = DENOMINATOR.divn(3)
      const changeUpBoundVars: ChangeUpBound = {
        bondSale: bondSalePubkey,
        upBound: newUpBound,
        payer: admin.publicKey
      }

      await assertThrowsAsync(sale.changeUpBound(changeUpBoundVars, admin), ERROR.CONSTRAINT_RAW)
    })
  })

  describe('wallet', () => {
    it('#initBondSale()', async () => {
      const payerBondAccount = await tokenBond.createAccount(wallet.publicKey)
      const payerQuoteAccount = await tokenQuote.createAccount(wallet.publicKey)
      await tokenBond.mintTo(payerBondAccount, mintAuthority, [mintAuthority], 1000)

      const initBondSaleVars: InitBondSale = {
        supply: new BN(1000),
        duration: new BN(100),
        floorPrice: DENOMINATOR,
        payerBondAccount,
        tokenBond,
        tokenQuote,
        upBound: DENOMINATOR.divn(2),
        velocity: DENOMINATOR.divn(2),
        vestingTime: new BN(10)
      }

      bondSalePubkey = await sale.initBondSale(initBondSaleVars)
    })

    it('#changeVelocity()', async () => {
      const newVelocity = DENOMINATOR.divn(3)
      const changeVelocityVars: ChangeVelocity = {
        bondSale: bondSalePubkey,
        velocity: newVelocity
      }

      await sale.changeVelocity(changeVelocityVars)

      const bondSale = await sale.getBondSale(bondSalePubkey)
      assert.ok(bondSale.velocity.v.eq(new BN(DENOMINATOR.divn(3))))
    })

    it('changeUpBound()', async () => {
      const newUpBound = DENOMINATOR.divn(3)
      const changeUpBoundVars: ChangeUpBound = {
        bondSale: bondSalePubkey,
        upBound: newUpBound
      }

      await sale.changeUpBound(changeUpBoundVars)
      const bondSale = await sale.getBondSale(bondSalePubkey)
      assert.ok(bondSale.upBound.v.eq(new BN(DENOMINATOR.divn(3))))
    })
  })
})
