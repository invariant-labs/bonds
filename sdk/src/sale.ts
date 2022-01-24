import { Program, Provider, BN } from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction
} from '@solana/web3.js'
import { IWallet } from '.'

import { Bonds, IDL } from './idl/bonds'
import { getProgramAddress, Network } from './network'

import { signAndSend } from './utils'
export const SEED = 'Bonds'

export const DEFAULT_PUBLIC_KEY = new PublicKey(0)

export class Sale {
  public connection: Connection
  public wallet: IWallet
  public program: Program<Bonds>
  public stateAddress: PublicKey = PublicKey.default
  public programAuthority: PublicKey = PublicKey.default

  private constructor(
    network: Network,
    wallet: IWallet,
    connection: Connection,
    programId?: PublicKey
  ) {
    this.connection = connection
    this.wallet = wallet
    const programAddress = new PublicKey(getProgramAddress(network))
    const provider = new Provider(connection, wallet, Provider.defaultOptions())

    this.program = new Program(IDL, programAddress, provider)
  }

  public static async build(
    network: Network,
    wallet: IWallet,
    connection: Connection,
    programId?: PublicKey
  ): Promise<Sale> {
    const instance = new Sale(network, wallet, connection, programId)
    return instance
  }

  async getProgramAuthority() {
    const [programAuthority, nonce] = await PublicKey.findProgramAddress(
      [Buffer.from(SEED)],
      this.program.programId
    )
    return {
      programAuthority,
      nonce
    }
  }

  async initBondSaleInstruction(
    initBondSale: InitBondSale,
    bondSalePub: PublicKey,
    bondSaleBuyPub: PublicKey,
    bondSaleSellPub: PublicKey
  ) {
    const {
      tokenBuy,
      tokenSell,
      payerBuyAccount,
      payerSellAccount,
      floorPrice,
      upBound,
      velocity,
      buyAmount,
      endTime
    } = initBondSale
    const payerPubkey = initBondSale.payer || this.wallet.publicKey

    return this.program.instruction.initBondSale(
      floorPrice,
      upBound,
      velocity,
      buyAmount,
      endTime,
      {
        accounts: {
          bondSale: bondSalePub,
          tokenBuy: tokenBuy.publicKey,
          tokenSell: tokenSell.publicKey,
          bondSaleBuy: bondSaleBuyPub,
          bondSaleSell: bondSaleSellPub,
          payerBuyAccount,
          payerSellAccount,
          payer: payerPubkey,
          authority: this.programAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        }
      }
    )
  }

  async initBondSaleTransaction(
    initBondSale: InitBondSale,
    bondSalePub: PublicKey,
    bondSaleBuyPub: PublicKey,
    bondSaleSellPub: PublicKey
  ) {
    const ix = await this.initBondSaleInstruction(
      initBondSale,
      bondSalePub,
      bondSaleBuyPub,
      bondSaleSellPub
    )

    return new Transaction().add(ix)
  }

  async initBondSale(initBondSale: InitBondSale, payer: Keypair) {
    const bondSaleAddress = Keypair.generate()
    const bondSaleBuyAccount = Keypair.generate()
    const bondSaleSellAccount = Keypair.generate()

    const tx = await this.initBondSaleTransaction(
      initBondSale,
      bondSaleAddress.publicKey,
      bondSaleBuyAccount.publicKey,
      bondSaleSellAccount.publicKey
    )

    await signAndSend(
      tx,
      [payer, bondSaleAddress, bondSaleBuyAccount, bondSaleSellAccount],
      this.connection
    )
  }

  async createBondInstruction() {}
}

export interface InitBondSale {
  tokenBuy: Token
  tokenSell: Token
  payerBuyAccount: PublicKey
  payerSellAccount: PublicKey
  payer?: PublicKey
  floorPrice: BN
  upBound: BN
  velocity: BN
  buyAmount: BN
  endTime: BN
}

export interface CreateBond {
  tokenBuy: Token
  tokenSell: Token
}
