import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Network } from '@invariant-labs/bonds-sdk'
import { ChangeFee, InitBondSale } from '@invariant-labs/bonds-sdk/lib/sale'
import { DENOMINATOR, toDecimal } from '@invariant-labs/bonds-sdk/lib/utils'
import { assert } from 'chai'
import { createToken } from './testUtils'
import { Bonds } from '@invariant-labs/bonds-sdk/src'

describe('claim-quote', () => {
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

    await bonds.createState(admin.publicKey, admin)
  })

  describe('changeFee', () => {
    it('#initBondSale()', async () => {
      const payerBondAccount = await tokenBond.createAccount(bondInitPayer.publicKey)
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
        vestingTime: new BN(20)
      }

      bondSalePubkey = await bonds.initBondSale(initBondSaleVars, bondInitPayer)
    })

    it('#changeFee()', async () => {
      const newFee = toDecimal(new BN(1), 1)

      const changeFeeVars: ChangeFee = {
        bondSale: bondSalePubkey,
        admin: admin.publicKey,
        newFee: newFee.v
      }
      await bonds.changeFee(changeFeeVars, admin)

      const bondSale = await bonds.getBondSale(bondSalePubkey)
      assert.ok(bondSale.fee.v.eq(newFee.v))
    })
  })
})
