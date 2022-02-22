import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Network } from '@invariant-labs/bonds-sdk'
import { ClaimBond, CreateBond, InitBondSale } from '@invariant-labs/bonds-sdk/lib/sale'
import { DENOMINATOR, sleep } from '@invariant-labs/bonds-sdk/lib/utils'
import { assert } from 'chai'
import { almostEqual, createToken } from './testUtils'
import { Bonds } from '@invariant-labs/bonds-sdk/lib/sale'

describe('claim-bond', () => {
  const provider = Provider.local()
  const connection = provider.connection

  // @ts-expect-error
  const wallet = provider.wallet.payer as Keypair
  const mintAuthority = Keypair.generate()
  const admin = Keypair.generate()
  const bondInitPayer = Keypair.generate()
  const bondOwner = Keypair.generate()

  let sale: Bonds
  let tokenBond: Token
  let tokenQuote: Token
  let bondSalePubkey: PublicKey
  let payerQuoteAccount: PublicKey

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

      bondSalePubkey = await sale.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#createBond()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(bondOwner.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)
      const createBondVars: CreateBond = {
        amount: new BN(100),
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }

      await sale.createBond(createBondVars, bondOwner)
    })

    it('#claimBond()', async () => {
      await sleep(5000)

      const ownerBondAccount = await tokenBond.createAccount(bondOwner.publicKey)
      const claimBondVars: ClaimBond = {
        ownerBondAccount,
        bondId: new BN(0),
        tokenBond: tokenBond.publicKey,
        owner: bondOwner.publicKey
      }
      await sale.claimBond(claimBondVars, bondOwner)

      const bondSale = await sale.getBondSale(bondSalePubkey)
      const tokenBondAccount = bondSale.tokenBondAccount
      const amount = (await tokenBond.getAccountInfo(ownerBondAccount)).amount
      assert.ok(almostEqual(amount, new BN(60)))
      assert.ok(almostEqual((await tokenBond.getAccountInfo(tokenBondAccount)).amount, new BN(940)))
    })

    it('closeBond()', async () => {
      await sleep(11000)

      const ownerBondAccount = await tokenBond.createAccount(bondOwner.publicKey)
      const claimBondVars: ClaimBond = {
        ownerBondAccount,
        bondId: new BN(0),
        tokenBond: tokenBond.publicKey,
        owner: bondOwner.publicKey
      }
      await sale.claimBond(claimBondVars, bondOwner)

      const bondSale = await sale.getBondSale(bondSalePubkey)
      const tokenBondAccount = bondSale.tokenBondAccount
      const amount = (await tokenBond.getAccountInfo(ownerBondAccount)).amount

      assert.ok(almostEqual(amount, new BN(40)))
      assert.ok(
        almostEqual(
          (await tokenBond.getAccountInfo(tokenBondAccount)).amount,
          new BN(900),
          new BN(20)
        )
      )
      assert.isUndefined((await sale.getAllBonds(bondSalePubkey, bondOwner.publicKey)).at(0))
    })
  })

  describe('wallet', () => {
    it('#initBondSale()', async () => {
      const payerBondAccount = await tokenBond.createAccount(wallet.publicKey)
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

      bondSalePubkey = await sale.initBondSale(initBondSaleVars)
    })

    it('#createBond()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(wallet.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)
      const createBondVars: CreateBond = {
        amount: new BN(100),
        bondSale: bondSalePubkey,
        ownerQuoteAccount
      }

      await sale.createBond(createBondVars)
    })

    it('#claimBond()', async () => {
      await sleep(5000)

      const ownerBondAccount = await tokenBond.createAccount(wallet.publicKey)
      const claimBondVars: ClaimBond = {
        ownerBondAccount,
        bondId: new BN(0),
        tokenBond: tokenBond.publicKey
      }
      await sale.claimBond(claimBondVars)

      const bondSale = await sale.getBondSale(bondSalePubkey)
      const tokenBondAccount = bondSale.tokenBondAccount
      const amount = (await tokenBond.getAccountInfo(ownerBondAccount)).amount
      assert.ok(almostEqual(amount, new BN(60)))
      assert.ok(almostEqual((await tokenBond.getAccountInfo(tokenBondAccount)).amount, new BN(940)))
    })

    it('closeBond()', async () => {
      await sleep(11000)

      const ownerBondAccount = await tokenBond.createAccount(wallet.publicKey)
      const claimBondVars: ClaimBond = {
        ownerBondAccount,
        bondId: new BN(0),
        tokenBond: tokenBond.publicKey
      }
      await sale.claimBond(claimBondVars)

      const bondSale = await sale.getBondSale(bondSalePubkey)
      const tokenBondAccount = bondSale.tokenBondAccount
      const amount = (await tokenBond.getAccountInfo(ownerBondAccount)).amount
      assert.ok(almostEqual(amount, new BN(40)))
      assert.ok(
        almostEqual(
          (await tokenBond.getAccountInfo(tokenBondAccount)).amount,
          new BN(900),
          new BN(20)
        )
      )
      assert.isUndefined((await sale.getAllBonds(bondSalePubkey, wallet.publicKey)).at(0))
    })
  })
})
