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

import { Bonds as BondsProgram, IDL } from './idl/bonds'
import { getProgramAddress, Network } from './network'

import { signAndSend } from './utils'
export const SEED = 'Bonds'
export const BOND_SEED = 'bondv1'
export const STATE_SEED = 'statev1'

export const DEFAULT_PUBLIC_KEY = new PublicKey(0)

export class Bonds {
  public connection: Connection
  public wallet: IWallet
  public program: Program<BondsProgram>
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
  ): Promise<Bonds> {
    const instance = new Bonds(network, wallet, connection, programId)
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

  async getStateAddress() {
    const [stateAddress, bump] = await PublicKey.findProgramAddress(
      [Buffer.from(STATE_SEED)],
      this.program.programId
    )

    return {
      stateAddress,
      bump
    }
  }

  async createStateInstruction(admin: PublicKey) {
    const { stateAddress } = await this.getStateAddress()
    const { programAuthority, nonce } = await this.getProgramAuthority()

    return this.program.instruction.createState(nonce, {
      accounts: {
        state: stateAddress,
        admin,
        programAuthority,
        systemProgram: SystemProgram.programId
      }
    })
  }

  async createStateTransaction(admin: PublicKey) {
    const ix = await this.createStateInstruction(admin)

    return new Transaction().add(ix)
  }

  async createState(admin: PublicKey, signer: Keypair) {
    const tx = await this.createStateTransaction(admin)

    if (signer === undefined) {
      await signAndSend(tx, this.connection, undefined, this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer])
    }
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
      floorPrice,
      upBound,
      velocity,
      supply,
      duration,
      vestingTime
    } = initBondSale
    const payerPubkey = initBondSale.payer ?? this.wallet.publicKey
    const { stateAddress } = await this.getStateAddress()

    const { programAuthority } = await this.getProgramAuthority()

    return this.program.instruction.initBondSale(
      floorPrice,
      upBound,
      velocity,
      supply,
      duration,
      vestingTime,
      {
        accounts: {
          state: stateAddress,
          bondSale: bondSalePub,
          tokenBond: tokenBond.publicKey,
          tokenQuote: tokenQuote.publicKey,
          tokenBondAccount: tokenBondAccountPub,
          tokenQuoteAccount: tokenQuoteAccountPub,
          payerBondAccount,
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
    const payer = initBondSale.payer ?? this.wallet.publicKey

    const createIx = SystemProgram.createAccount({
      fromPubkey: payer,
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
      feePayer: payer
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
      await signAndSend(
        tx,
        this.connection,
        [bondSaleAddress, bondSaleBondAccount, bondSaleQuoteAccount],
        this.wallet
      )
    } else {
      await signAndSend(tx, this.connection, [
        payer,
        bondSaleAddress,
        bondSaleBondAccount,
        bondSaleQuoteAccount
      ])
    }
    return bondSaleAddress.publicKey
  }

  async getBondByAddress(bondPub: PublicKey) {
    return (await this.program.account.bond.fetch(bondPub)) as BondStruct
  }

  async getBondById(bondSale: PublicKey, id: BN) {
    return (
      await this.program.account.bond.all([
        {
          memcmp: { bytes: bs58.encode(bondSale.toBuffer()), offset: 8 }
        },
        {
          memcmp: { bytes: bs58.encode(id.toBuffer()), offset: 136 }
        }
      ])
    )[0]
  }

  async getAllOwnerBondsInBondSale(bondSale: PublicKey, owner: PublicKey) {
    return await this.program.account.bond.all([
      {
        memcmp: { bytes: bs58.encode(bondSale.toBuffer()), offset: 8 }
      },
      {
        memcmp: { bytes: bs58.encode(owner.toBuffer()), offset: 72 }
      }
    ])
  }

  async getAllOwnerBonds(owner: PublicKey) {
    return await this.program.account.bond.all([
      {
        memcmp: { bytes: bs58.encode(owner.toBuffer()), offset: 72 }
      }
    ])
  }

  async getAllBonds(bondSale: PublicKey) {
    return await this.program.account.bond.all([
      {
        memcmp: { bytes: bs58.encode(bondSale.toBuffer()), offset: 8 }
      }
    ])
  }

  async getAllBondSales() {
    return await this.program.account.bondSale.all([])
  }

  async getBondSaleById(id: BN) {
    return (
      await this.program.account.bondSale.all([
        {
          memcmp: { bytes: bs58.encode(id.toBuffer()), offset: 328 }
        }
      ])
    )[0]
  }

  async createBondInstruction(createBond: CreateBond, bondPub: PublicKey) {
    const { bondSale, ownerQuoteAccount, amount, priceLimit } = createBond
    const ownerPubkey = createBond.owner ?? this.wallet.publicKey
    const bondSaleStruct = await this.getBondSale(bondSale)

    return this.program.instruction.createBond(amount, priceLimit, {
      accounts: {
        bondSale,
        bond: bondPub,
        ownerQuoteAccount,
        tokenBondAccount: bondSaleStruct.tokenBondAccount,
        tokenQuoteAccount: bondSaleStruct.tokenQuoteAccount,
        owner: ownerPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    })
  }

  async createBondTransaction(createBond: CreateBond, bondPub: PublicKey) {
    const payer = createBond.owner ?? this.wallet.publicKey

    const createIx = SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: bondPub,
      space: this.program.account.bond.size,
      lamports: await this.connection.getMinimumBalanceForRentExemption(
        this.program.account.bond.size
      ),
      programId: this.program.programId
    })
    const initIx = await this.createBondInstruction(createBond, bondPub)

    return new Transaction({
      feePayer: payer
    })
      .add(createIx)
      .add(initIx)
  }

  async createBond(createBond: CreateBond, signer?: Keypair) {
    const bond = Keypair.generate()
    const tx = await this.createBondTransaction(createBond, bond.publicKey)

    if (signer === undefined) {
      await signAndSend(tx, this.connection, [bond], this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer, bond])
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
      await signAndSend(tx, this.connection, undefined, this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer])
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
      await signAndSend(tx, this.connection, undefined, this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer])
    }
  }

  async claimQuoteInstruction(claimQuote: ClaimQuote) {
    const { bondSale, payerQuoteAccount } = claimQuote
    const payerPubkey = claimQuote.payer ?? this.wallet.publicKey
    const bondSaleQuoteAccount = (await this.getBondSale(bondSale)).tokenQuoteAccount
    const { programAuthority } = await this.getProgramAuthority()
    const { stateAddress } = await this.getStateAddress()

    return this.program.instruction.claimQuote({
      accounts: {
        state: stateAddress,
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
      await signAndSend(tx, this.connection, undefined, this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer])
    }
  }

  async claimBondInstruction(claimBond: ClaimBond) {
    const { bondSale, ownerBondAccount, bondId } = claimBond
    const owner = claimBond.owner ?? this.wallet.publicKey
    const bond = await this.getBondById(bondSale, bondId)
    const { programAuthority } = await this.getProgramAuthority()
    const { stateAddress } = await this.getStateAddress()
    const bondSaleStruct = await this.getBondSale(bondSale)

    return this.program.instruction.claimBond({
      accounts: {
        state: stateAddress,
        bondSale,
        bond: bond.publicKey,
        tokenBondAccount: bondSaleStruct.tokenBondAccount,
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
      await signAndSend(tx, this.connection, undefined, this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer])
    }
  }

  async endBondSaleInstruction(endBondSale: EndBondSale) {
    const { bondSale, payerQuoteAccount, payerBondAccount, adminQuoteAccount } = endBondSale
    const { programAuthority } = await this.getProgramAuthority()
    const bondSaleStruct = await this.getBondSale(bondSale)
    const payerPubkey = endBondSale.payer ?? this.wallet.publicKey
    const { stateAddress } = await this.getStateAddress()

    return this.program.instruction.endBondSale({
      accounts: {
        state: stateAddress,
        bondSale,
        tokenQuoteAccount: bondSaleStruct.tokenQuoteAccount,
        tokenBondAccount: bondSaleStruct.tokenBondAccount,
        payerQuoteAccount,
        payerBondAccount,
        adminQuoteAccount,
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
      await signAndSend(tx, this.connection, undefined, this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer])
    }
  }

  async changeFeeInstruction(changeFee: ChangeFee) {
    const { bondSale, newFee } = changeFee
    const { stateAddress } = await this.getStateAddress()
    const admin = changeFee.admin ?? this.wallet.publicKey

    return this.program.instruction.changeFee(newFee, {
      accounts: {
        state: stateAddress,
        bondSale,
        admin
      }
    })
  }

  async changeFeeTransaction(changeFee: ChangeFee) {
    const ix = await this.changeFeeInstruction(changeFee)

    return new Transaction().add(ix)
  }

  async changeFee(changeFee: ChangeFee, signer?: Keypair) {
    const tx = await this.changeFeeTransaction(changeFee)

    if (signer === undefined) {
      await signAndSend(tx, this.connection, undefined, this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer])
    }
  }

  async withdrawFeeInstruction(withdrawFee: WithdrawFee) {
    const { bondSale, adminQuoteAccount } = withdrawFee
    const { stateAddress } = await this.getStateAddress()
    const admin = withdrawFee.admin ?? this.wallet.publicKey
    const bondSaleStruct = await this.getBondSale(bondSale)
    const { programAuthority } = await this.getProgramAuthority()

    return this.program.instruction.withdrawFee({
      accounts: {
        state: stateAddress,
        bondSale,
        tokenQuoteAccount: bondSaleStruct.tokenQuoteAccount,
        adminQuoteAccount,
        admin,
        authority: programAuthority,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    })
  }

  async withdrawFeeTransaction(withdrawFee: WithdrawFee) {
    const ix = await this.withdrawFeeInstruction(withdrawFee)

    return new Transaction().add(ix)
  }

  async withdrawFee(withdrawFee: WithdrawFee, signer?: Keypair) {
    const tx = await this.withdrawFeeTransaction(withdrawFee)

    if (signer === undefined) {
      await signAndSend(tx, this.connection, undefined, this.wallet)
    } else {
      await signAndSend(tx, this.connection, [signer])
    }
  }
}

export interface InitBondSale {
  tokenBond: Token
  tokenQuote: Token
  payerBondAccount: PublicKey
  payer?: PublicKey
  floorPrice: BN
  upBound: BN
  velocity: BN
  supply: BN
  duration: BN
  vestingTime: BN
}

export interface CreateBond {
  bondSale: PublicKey
  ownerQuoteAccount: PublicKey
  priceLimit: BN
  amount: BN
  owner?: PublicKey
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
  bondSale: PublicKey
  ownerBondAccount: PublicKey
  owner?: PublicKey
  bondId: BN
}

export interface EndBondSale {
  bondSale: PublicKey
  payerQuoteAccount: PublicKey
  payerBondAccount: PublicKey
  adminQuoteAccount: PublicKey
  payer?: PublicKey
}

export interface ChangeFee {
  bondSale: PublicKey
  admin?: PublicKey
  newFee: BN
}

export interface WithdrawFee {
  bondSale: PublicKey
  adminQuoteAccount: PublicKey
  admin?: PublicKey
}
export interface BondStruct {
  bondSale: PublicKey
  tokenBond: PublicKey
  owner: PublicKey
  bondAmount: TokenAmount
  lastClaim: BN
  vestingStart: BN
  vestingEnd: BN
  id: BN
}

export interface BondSaleStruct {
  tokenBond: PublicKey
  tokenQuote: PublicKey
  tokenBondAccount: PublicKey
  tokenQuoteAccount: PublicKey
  payer: PublicKey
  fee: Decimal
  feeAmount: TokenAmount
  floorPrice: Decimal
  previousPrice: Decimal
  upBound: Decimal
  velocity: Decimal
  supply: TokenAmount
  remainingAmount: TokenAmount
  quoteAmount: TokenAmount
  endTime: BN
  startTime: BN
  lastTrade: BN
  vestingTime: BN
  nextBond: BN
  id: BN
}

export interface Decimal {
  v: BN
}

export interface TokenAmount {
  v: BN
}
