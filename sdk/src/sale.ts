import { Program, Provider, BN, utils } from '@project-serum/anchor'
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
export const BOND_SEED = 'bondv1'

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

  async getBondSale(bondSalePubkey: PublicKey) {
    return (await this.program.account.bondSale.fetch(bondSalePubkey)) as BondSaleStruct
  }

  async initBondSaleInstruction(
    initBondSale: InitBondSale,
    bondSalePub: PublicKey,
    tokenBondAccountPub: PublicKey,
    tokenQuoteAccountPub: PublicKey
  ) {
    const {
      tokenBond,
      tokenQuote,
      payerBondAccount,
      payerQuoteAccount,
      floorPrice,
      upBound,
      velocity,
      buyAmount,
      endTime
    } = initBondSale
    const payerPubkey = initBondSale.payer ?? this.wallet.publicKey

    return this.program.instruction.initBondSale(
      floorPrice,
      upBound,
      velocity,
      buyAmount,
      endTime,
      {
        accounts: {
          bondSale: bondSalePub,
          tokenBond: tokenBond.publicKey,
          tokenQuote: tokenQuote.publicKey,
          tokenBondAccount: tokenBondAccountPub,
          tokenQuoteAccount: tokenQuoteAccountPub,
          payerBondAccount,
          payerQuoteAccount,
          payer: payerPubkey,
          authority: payerPubkey,
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
    bondSaleBondPub: PublicKey,
    bondSaleQuotePub: PublicKey
  ) {
    const createIx = SystemProgram.createAccount({
      fromPubkey: initBondSale.payer,
      newAccountPubkey: bondSalePub,
      space: this.program.account.bondSale.size,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        this.program.account.bondSale.size
      ),
      programId: this.program.programId
    })

    const initIx = await this.initBondSaleInstruction(
      initBondSale,
      bondSalePub,
      bondSaleBondPub,
      bondSaleQuotePub
    )

    return new Transaction({
      feePayer: initBondSale.payer
    })
      .add(createIx)
      .add(initIx)
  }

  async initBondSale(initBondSale: InitBondSale, payer: Keypair) {
    const bondSaleAddress = Keypair.generate()
    const bondSaleBondAccount = Keypair.generate()
    const bondSaleQuoteAccount = Keypair.generate()

    const tx = await this.initBondSaleTransaction(
      initBondSale,
      bondSaleAddress.publicKey,
      bondSaleBondAccount.publicKey,
      bondSaleQuoteAccount.publicKey
    )

    await signAndSend(
      tx,
      [payer, bondSaleAddress, bondSaleBondAccount, bondSaleQuoteAccount],
      this.connection
    )

    return bondSaleAddress.publicKey
  }

  async getBondAddress(owner: PublicKey, bondSale: PublicKey) {
    const [bondAddress, bump] = await PublicKey.findProgramAddress(
      [Buffer.from(utils.bytes.utf8.encode(BOND_SEED)), owner.toBuffer(), bondSale.toBuffer()],
      this.program.programId
    )

    return {
      bondAddress,
      bump
    }
  }

  async createBondInstruction(
    createBond: CreateBond,
    bondAccountPub: PublicKey,
    quoteAccountPub: PublicKey
  ) {
    const { bondSale, buyAmount, quoteAmount } = createBond
    const ownerPubkey = createBond.owner ?? this.wallet.publicKey
    const bondSaleStruct = await this.getBondSale(bondSale)
    const { bondAddress, bump } = await this.getBondAddress(ownerPubkey, bondSale)

    return this.program.instruction.createBond(buyAmount, quoteAmount, bump, {
      accounts: {
        bondSale,
        bond: bondAddress,
        tokenBond: bondSaleStruct.tokenBond,
        tokenQuote: bondSaleStruct.tokenQuote,
        bondAccount: bondAccountPub,
        quoteAccount: quoteAccountPub,
        bondSaleBondAccount: bondSaleStruct.tokenBondAccount,
        bondSaleQuoteAccount: bondSaleStruct.tokenQuoteAccount,
        owner: ownerPubkey,
        authority: this.programAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    })
  }
}

export interface InitBondSale {
  tokenBond: Token
  tokenQuote: Token
  payerBondAccount: PublicKey
  payerQuoteAccount: PublicKey
  payer?: PublicKey
  floorPrice: BN
  upBound: BN
  velocity: BN
  buyAmount: BN
  endTime: BN
}

export interface CreateBond {
  bondSale: PublicKey
  buyAmount: BN
  quoteAmount: BN
  owner?: PublicKey
}

export interface BondSaleStruct {
  tokenBond: PublicKey
  tokenQuote: PublicKey
  tokenBondAccount: PublicKey
  tokenQuoteAccount: PublicKey
  payer: PublicKey
  authority: PublicKey
  floorPrice: Decimal
  upBound: Decimal
  velocity: Decimal
  bondAmount: TokenAmount
  remainingAmount: TokenAmount
  quoteAmount: TokenAmount
  saleTime: BN
}

export interface Decimal {
  v: BN
}

export interface TokenAmount {
  v: BN
}