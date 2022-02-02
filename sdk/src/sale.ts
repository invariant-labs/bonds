import { Program, Provider, BN } from '@project-serum/anchor'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
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

import { signAndSend, signAndSendWallet } from './utils'
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
      duration,
      distribution
    } = initBondSale
    const payerPubkey = initBondSale.payer ?? this.wallet.publicKey

    const { programAuthority } = await this.getProgramAuthority()

    return this.program.instruction.initBondSale(
      floorPrice,
      upBound,
      velocity,
      buyAmount,
      duration,
      distribution,
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
          authority: programAuthority,
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

  async initBondSale(initBondSale: InitBondSale, payer?: Keypair) {
    const bondSaleAddress = Keypair.generate()
    const bondSaleBondAccount = Keypair.generate()
    const bondSaleQuoteAccount = Keypair.generate()

    const tx = await this.initBondSaleTransaction(
      initBondSale,
      bondSaleAddress.publicKey,
      bondSaleBondAccount.publicKey,
      bondSaleQuoteAccount.publicKey
    )

    if (payer === undefined) {
      await signAndSendWallet(this.wallet, tx, this.connection, [
        bondSaleAddress,
        bondSaleBondAccount,
        bondSaleQuoteAccount
      ])
    } else {
      await signAndSend(
        tx,
        [payer, bondSaleAddress, bondSaleBondAccount, bondSaleQuoteAccount],
        this.connection
      )
    }
    return bondSaleAddress.publicKey
  }

  async getBond(bondPub: PublicKey) {
    return (await this.program.account.bond.fetch(bondPub)) as BondStruct
  }

  async getAllBonds(tokenBond: PublicKey, owner: PublicKey) {
    return await this.program.account.bond.all([
      {
        memcmp: { bytes: bs58.encode(tokenBond.toBuffer()), offset: 8 }
      },
      {
        memcmp: { bytes: bs58.encode(owner.toBuffer()), offset: 40 }
      }
    ])
  }

  async createBondInstruction(createBond: CreateBond, bondPub: PublicKey) {
    const { bondSale, ownerQuoteAccount, amount, byAmountIn } = createBond
    const ownerPubkey = createBond.owner ?? this.wallet.publicKey
    const bondSaleStruct = await this.getBondSale(bondSale)
    const { programAuthority } = await this.getProgramAuthority()

    return this.program.instruction.createBond(amount, byAmountIn, {
      accounts: {
        bondSale,
        bond: bondPub,
        tokenBond: bondSaleStruct.tokenBond,
        tokenQuote: bondSaleStruct.tokenQuote,
        ownerQuoteAccount,
        tokenBondAccount: bondSaleStruct.tokenBondAccount,
        tokenQuoteAccount: bondSaleStruct.tokenQuoteAccount,
        owner: ownerPubkey,
        authority: programAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    })
  }

  async createBondTransaction(createBond: CreateBond, bondPub: PublicKey) {
    const createIx = SystemProgram.createAccount({
      fromPubkey: createBond.owner,
      newAccountPubkey: bondPub,
      space: this.program.account.bond.size,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        this.program.account.bond.size
      ),
      programId: this.program.programId
    })
    const initIx = await this.createBondInstruction(createBond, bondPub)

    return new Transaction({
      feePayer: createBond.owner
    })
      .add(createIx)
      .add(initIx)
  }

  async createBond(createBond: CreateBond, signer?: Keypair) {
    const bond = Keypair.generate()
    const tx = await this.createBondTransaction(createBond, bond.publicKey)

    if (signer === undefined) {
      await signAndSendWallet(this.wallet, tx, this.connection, [bond])
    } else {
      await signAndSend(tx, [signer, bond], this.connection)
    }

    return bond.publicKey
  }

  async changeVelocityInstruction(changeVelocity: ChangeVelocity) {
    const { bondSale, velocity } = changeVelocity
    const payerPubkey = changeVelocity.payer ?? this.wallet.publicKey

    return this.program.instruction.changeVelocity(velocity, {
      accounts: {
        bondSale,
        payer: payerPubkey
      }
    })
  }

  async changeVelocityTransaction(changeVelocity: ChangeVelocity) {
    const ix = await this.changeVelocityInstruction(changeVelocity)

    return new Transaction().add(ix)
  }

  async changeVelocity(changeVelocity: ChangeVelocity, signer?: Keypair) {
    const tx = await this.changeVelocityTransaction(changeVelocity)

    if (signer === undefined) {
      await signAndSendWallet(this.wallet, tx, this.connection)
    } else {
      await signAndSend(tx, [signer], this.connection)
    }
  }

  async changeUpBoundInstruction(changeUpBound: ChangeUpBound) {
    const { bondSale, upBound } = changeUpBound
    const payerPubkey = changeUpBound.payer ?? this.wallet.publicKey

    return this.program.instruction.changeUpBound(upBound, {
      accounts: {
        bondSale,
        payer: payerPubkey
      }
    })
  }

  async changeUpBoundTransaction(changeUpBound: ChangeUpBound) {
    const ix = await this.changeUpBoundInstruction(changeUpBound)

    return new Transaction().add(ix)
  }

  async changeUpBound(changeUpBound: ChangeUpBound, signer?: Keypair) {
    const tx = await this.changeUpBoundTransaction(changeUpBound)

    if (signer === undefined) {
      await signAndSendWallet(this.wallet, tx, this.connection)
    } else {
      await signAndSend(tx, [signer], this.connection)
    }
  }

  async claimQuoteInstruction(claimQuote: ClaimQuote) {
    const { bondSale, payerQuoteAccount } = claimQuote
    const payerPubkey = claimQuote.payer ?? this.wallet.publicKey
    const bondSaleQuoteAccount = (await this.getBondSale(bondSale)).tokenQuoteAccount
    const { programAuthority, nonce } = await this.getProgramAuthority()

    return this.program.instruction.claimQuote(nonce, {
      accounts: {
        bondSale: bondSale,
        bondSaleQuoteAccount,
        payerQuoteAccount,
        payer: payerPubkey,
        authority: programAuthority,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    })
  }

  async claimQuoteTransaction(claimQuote: ClaimQuote) {
    const ix = await this.claimQuoteInstruction(claimQuote)

    return new Transaction().add(ix)
  }

  async claimQuote(claimQuote: ClaimQuote, signer?: Keypair) {
    const tx = await this.claimQuoteTransaction(claimQuote)

    if (signer === undefined) {
      await signAndSendWallet(this.wallet, tx, this.connection)
    } else {
      await signAndSend(tx, [signer], this.connection)
    }
  }

  async claimBondInstruction(claimBond: ClaimBond) {
    const { tokenBond, ownerBondAccount, bondId } = claimBond
    const owner = claimBond.owner ?? this.wallet.publicKey
    const bond = (await this.getAllBonds(tokenBond, owner)).at(bondId.toNumber())
    const { programAuthority, nonce } = await this.getProgramAuthority()

    return this.program.instruction.claimBond(nonce, {
      accounts: {
        bond: bond.publicKey,
        tokenBondAccount: bond.account.tokenBondAccount,
        ownerBondAccount,
        owner,
        authority: programAuthority,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    })
  }

  async claimBondTransaction(claimBond: ClaimBond) {
    const ix = await this.claimBondInstruction(claimBond)

    return new Transaction().add(ix)
  }

  async claimBond(claimBond: ClaimBond, signer?: Keypair) {
    const tx = await this.claimBondTransaction(claimBond)

    if (signer === undefined) {
      await signAndSendWallet(this.wallet, tx, this.connection)
    } else {
      await signAndSend(tx, [signer], this.connection)
    }
  }

  async endBondSaleInstruction(endBondSale: EndBondSale) {
    const { bondSale, payerQuoteAccount, payerBondAccount } = endBondSale
    const { programAuthority, nonce } = await this.getProgramAuthority()
    const bondSaleStruct = await this.getBondSale(bondSale)
    const payerPubkey = endBondSale.payer ?? this.wallet.publicKey

    return this.program.instruction.endBondSale(nonce, {
      accounts: {
        bondSale,
        tokenQuoteAccount: bondSaleStruct.tokenQuoteAccount,
        tokenBondAccount: bondSaleStruct.tokenBondAccount,
        payerQuoteAccount,
        payerBondAccount,
        authority: programAuthority,
        payer: payerPubkey,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    })
  }

  async endBondSaleTransaction(endBondSale: EndBondSale) {
    const ix = await this.endBondSaleInstruction(endBondSale)

    return new Transaction().add(ix)
  }

  async endBondSale(endBondSale: EndBondSale, signer?: Keypair) {
    const tx = await this.endBondSaleTransaction(endBondSale)

    if (signer === undefined) {
      await signAndSendWallet(this.wallet, tx, this.connection)
    } else {
      await signAndSend(tx, [signer], this.connection)
    }
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
  duration: BN
  distribution: BN
}

export interface CreateBond {
  bondSale: PublicKey
  ownerQuoteAccount: PublicKey
  amount: BN
  owner?: PublicKey
  byAmountIn: boolean
}

export interface ChangeVelocity {
  bondSale: PublicKey
  payer?: PublicKey
  velocity: BN
}

export interface ChangeUpBound {
  bondSale: PublicKey
  payer?: PublicKey
  upBound: BN
}

export interface ClaimQuote {
  bondSale: PublicKey
  payerQuoteAccount: PublicKey
  payer?: PublicKey
}

export interface ClaimBond {
  tokenBond: PublicKey
  ownerBondAccount: PublicKey
  owner?: PublicKey
  bondId: BN
}

export interface EndBondSale {
  bondSale: PublicKey
  payerQuoteAccount: PublicKey
  payerBondAccount: PublicKey
  payer?: PublicKey
}
export interface BondStruct {
  tokenBond: PublicKey
  owner: PublicKey
  tokenBondAccount: PublicKey
  buyAmount: TokenAmount
  lastClaim: BN
  distributionEnd: BN
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
  endTime: BN
}

export interface Decimal {
  v: BN
}

export interface TokenAmount {
  v: BN
}
