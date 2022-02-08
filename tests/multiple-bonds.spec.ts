import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Bonds, Network } from '@invariant-labs-bonds/sdk'
import { CreateBond, InitBondSale } from '@invariant-labs-bonds/sdk/lib/sale'
import { DENOMINATOR, sleep } from '@invariant-labs-bonds/sdk/lib/utils'
import { assert } from 'chai'
import { createToken } from './testUtils'

// case with multiple bonds on a single bond sale needed

describe('create-bond', () => {
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
      bondSalePubkey = await sale.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#createBonds()', async () => {
      const ownerQuoteAccount = await tokenQuote.createAccount(bondOwner.publicKey)
      await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)

      const createBondVars: CreateBond = {
        amount: new BN(100),
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }

      const bondPub = await sale.createBond(createBondVars, bondOwner)
      const bond = await sale.getBond(bondPub)
      assert.ok(bond.buyAmount.v.eqn(100))
      assert.ok(bond.owner.toString() === bondOwner.publicKey.toString())
      assert.ok((await tokenQuote.getAccountInfo(ownerQuoteAccount)).amount.eqn(897))

      await sleep(500)

      const createBondVars2: CreateBond = {
        amount: new BN(50),
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }
      const bondSale2 = await sale.getBondSale(bondSalePubkey)
      console.log(bondSale2.previousPrice.v.toString())
      const bondPub2 = await sale.createBond(createBondVars2, bondOwner)
      console.time()
      const bond2 = await sale.getBond(bondPub2)
      assert.ok(bond2.buyAmount.v.eqn(50))
      assert.ok(bond2.owner.toString() === bondOwner.publicKey.toString())
      console.log((await tokenQuote.getAccountInfo(ownerQuoteAccount)).amount.toString())
      assert.ok((await tokenQuote.getAccountInfo(ownerQuoteAccount)).amount.eqn(844))

      await sleep(3000)

      const createBondVars3: CreateBond = {
        amount: new BN(111),
        bondSale: bondSalePubkey,
        ownerQuoteAccount,
        owner: bondOwner.publicKey
      }
      const bondSale3 = await sale.getBondSale(bondSalePubkey)
      console.log(bondSale3.previousPrice.v.toString())
      console.timeEnd()
      const bondPub3 = await sale.createBond(createBondVars3, bondOwner)
      const bond3 = await sale.getBond(bondPub3)
      console.log((await tokenQuote.getAccountInfo(ownerQuoteAccount)).amount.toString())
    })
  })
})
