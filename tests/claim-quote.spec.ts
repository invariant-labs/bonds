import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Sale, Network } from '@template-labs/sdk'
import { ClaimQuote, CreateBond, InitBondSale } from '@template-labs/sdk/lib/sale'
import { DENOMINATOR } from '@template-labs/sdk/lib/utils'
import { assert } from 'chai'
import { createToken } from './testUtils'

describe('create-bond', () => {
  const provider = Provider.local()
  const connection = provider.connection

  // @ts-expect-error
  const wallet = provider.wallet.payer as Keypair
  const mintAuthority = Keypair.generate()
  const admin = Keypair.generate()
  const bondInitPayer = Keypair.generate()
  const bondOwner = Keypair.generate()

  let sale: Sale
  let tokenBond: Token
  let tokenQuote: Token
  let bondSalePubkey: PublicKey
  let payerQuoteAccount: PublicKey

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
      await connection.requestAirdrop(bondInitPayer.publicKey, 1e12),
      await connection.requestAirdrop(bondOwner.publicKey, 1e12)
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
      payer: bondInitPayer.publicKey
    }

    bondSalePubkey = await sale.initBondSale(initBondSaleVars, bondInitPayer)
  })

  it('#createBond()', async () => {
    const ownerQuoteAccount = await tokenQuote.createAccount(bondOwner.publicKey)
    await tokenQuote.mintTo(ownerQuoteAccount, mintAuthority, [mintAuthority], 1000)
    const createBondVars: CreateBond = {
      amount: new BN(100),
      bondSale: bondSalePubkey,
      byAmountIn: false,
      ownerQuoteAccount,
      owner: bondOwner.publicKey
    }

    await sale.createBond(createBondVars, bondOwner)
  })

  it('#claimQuote()', async () => {
    const claimQuoteVars: ClaimQuote = {
      bondSale: bondSalePubkey,
      payerQuoteAccount,
      payer: bondInitPayer.publicKey
    }
    await sale.claimQuote(claimQuoteVars, bondInitPayer)

    const bondSale = await sale.getBondSale(bondSalePubkey)
    assert.ok(bondSale.quoteAmount.v.eqn(0))
    assert.ok((await tokenQuote.getAccountInfo(payerQuoteAccount)).amount.eqn(103))
  })
})