import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Network } from '@invariant-labs/bonds-sdk'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { assert } from 'chai'
import { assertThrowsAsync, createToken } from './testUtils'
import { DENOMINATOR, ERROR, toDecimal } from '@invariant-labs/bonds-sdk/lib/utils'
import { CreateBond, EndBondSale, InitBondSale } from '@invariant-labs/bonds-sdk/src/sale'
import { Bonds } from '@invariant-labs/bonds-sdk/src'
import { calculatePriceAfterSlippage } from '@invariant-labs/bonds-sdk/lib/math'

describe('end-bond-sale', () => {
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
  let payerQuoteAccount: PublicKey
  let payerBondAccount: PublicKey

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
  describe('bondInitPayer', () => {
    it('#initBondSale()', async () => {
      payerBondAccount = await tokenBond.createAccount(bondInitPayer.publicKey)
      payerQuoteAccount = await tokenQuote.createAccount(bondInitPayer.publicKey)
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

      bondSalePubkey = await bonds.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#createBond()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(bondOwner.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)
      const bondSale = await bonds.getBondSale(bondSalePubkey)

      const createBondVars: CreateBond = {
        amount: new BN(100),
        priceLimit: calculatePriceAfterSlippage(bondSale.previousPrice, toDecimal(1, 1)).v,
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }

      await bonds.createBond(createBondVars, bondOwner)
    })

    it('#endBondSale()', async () => {
      const endBondSaleVars: EndBondSale = {
        bondSale: bondSalePubkey,
        payerQuoteAccount,
        payerBondAccount,
        payer: bondInitPayer.publicKey
      }

      await bonds.endBondSale(endBondSaleVars, bondInitPayer)
      assert.ok((await tokenBond.getAccountInfo(payerBondAccount)).amount.eqn(900))
      assert.ok((await tokenQuote.getAccountInfo(payerQuoteAccount)).amount.eqn(103))
      await assertThrowsAsync(bonds.getBondSale(bondSalePubkey), ERROR.ACCOUNT_NOT_EXISTS)
    })
  })

  describe('wallet', () => {
    it('#initBondSale()', async () => {
      payerBondAccount = await tokenBond.createAccount(wallet.publicKey)
      payerQuoteAccount = await tokenQuote.createAccount(wallet.publicKey)
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

      bondSalePubkey = await bonds.initBondSale(initBondSaleVars)
    })

    it('#createBond()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(wallet.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)
      const bondSale = await bonds.getBondSale(bondSalePubkey)

      const createBondVars: CreateBond = {
        amount: new BN(100),
        priceLimit: calculatePriceAfterSlippage(bondSale.previousPrice, toDecimal(1, 1)).v,
        bondSale: bondSalePubkey,
        ownerQuoteAccount
      }

      await bonds.createBond(createBondVars)
    })

    it('#endBondSale()', async () => {
      const endBondSaleVars: EndBondSale = {
        bondSale: bondSalePubkey,
        payerQuoteAccount,
        payerBondAccount
      }

      await bonds.endBondSale(endBondSaleVars)
      assert.ok((await tokenBond.getAccountInfo(payerBondAccount)).amount.eqn(900))
      assert.ok((await tokenQuote.getAccountInfo(payerQuoteAccount)).amount.eqn(103))
      await assertThrowsAsync(bonds.getBondSale(bondSalePubkey), ERROR.ACCOUNT_NOT_EXISTS)
    })
  })
})
