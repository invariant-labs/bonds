import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Network } from '@invariant-labs/bonds-sdk'
import { CreateBond, InitBondSale } from '@invariant-labs/bonds-sdk/lib/sale'
import { DENOMINATOR, toDecimal } from '@invariant-labs/bonds-sdk/lib/utils'
import { assert } from 'chai'
import { assertThrowsAsync, createToken } from './testUtils'
import { Bonds } from '@invariant-labs/bonds-sdk/src'
import { calculatePriceAfterSlippage, calculateSellPrice } from '@invariant-labs/bonds-sdk/src/math'
import { ERROR } from '@invariant-labs/bonds-sdk/lib/utils'

describe('slippage', () => {
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
      connection.requestAirdrop(wallet.publicKey, 1e12),
      connection.requestAirdrop(admin.publicKey, 1e12),
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

  describe('limit above price', () => {
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

      bondSalePubkey = await bonds.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#createBond()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(bondOwner.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)
      const bondSale = await bonds.getBondSale(bondSalePubkey)

      const createBondVars: CreateBond = {
        amount: new BN(100),
        priceLimit: calculatePriceAfterSlippage(bondSale.previousPrice, toDecimal(5, 2)).v,
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }

      const bondPub = await bonds.createBond(createBondVars, bondOwner)
    })
  })

  describe('limit at price', () => {
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

      bondSalePubkey = await bonds.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#createBond()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(bondOwner.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)
      const bondSale = await bonds.getBondSale(bondSalePubkey)

      const createBondVars: CreateBond = {
        amount: new BN(100),
        priceLimit: new BN(1025000000000),
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }

      const bondPub = await bonds.createBond(createBondVars, bondOwner)
    })
  })

  describe('limit below price', () => {
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

      bondSalePubkey = await bonds.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#createBond()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(bondOwner.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)
      const bondSale = await bonds.getBondSale(bondSalePubkey)

      const createBondVars: CreateBond = {
        amount: new BN(100),
        priceLimit: calculatePriceAfterSlippage(bondSale.previousPrice, toDecimal(-5, 1)).v,
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }

      assertThrowsAsync(bonds.createBond(createBondVars, bondOwner), ERROR.PRICE_LIMIT_EXCEEDED)
    })
  })
})
