mod errors;
mod instructions;
mod interfaces;
mod macros;
mod math;
mod structs;
mod uint;
mod utils;

use anchor_lang::prelude::*;

use errors::*;
use instructions::*;

declare_id!("DojjMwd2tErELy9vuLs7Jb6JW7FBJEh4f25wibHp3HCm");
pub const SEED: &str = "Bonds";

#[program]
pub mod bonds {
    use super::*;

    pub fn create_state(ctx: Context<CreateState>, nonce: u8) -> ProgramResult {
        instructions::create_state::handler(ctx, nonce)
    }

    pub fn init_bond_sale(
        ctx: Context<InitBondSale>,
        floor_price: u128,
        up_bound: u128,
        velocity: u128,
        supply: u64,
        duration: u64,
        vesting_time: u64,
    ) -> ProgramResult {
        instructions::init_bond_sale::handler(
            ctx,
            floor_price,
            up_bound,
            velocity,
            supply,
            duration,
            vesting_time,
        )
    }

    pub fn create_bond(ctx: Context<CreateBond>, amount: u64, price_limit: u128) -> ProgramResult {
        instructions::create_bond::handler(ctx, amount, price_limit)
    }

    pub fn end_bond_sale(ctx: Context<EndBondSale>) -> ProgramResult {
        instructions::end_bond_sale::handler(ctx)
    }

    pub fn change_velocity(ctx: Context<ChangeVelocity>, velocity: u128) -> ProgramResult {
        instructions::change_velocity::handler(ctx, velocity)
    }

    pub fn change_up_bound(ctx: Context<ChangeUpBound>, up_bound: u128) -> ProgramResult {
        instructions::change_up_bound::handler(ctx, up_bound)
    }

    pub fn claim_quote(ctx: Context<ClaimQuote>) -> ProgramResult {
        instructions::claim_quote::handler(ctx)
    }

    pub fn claim_bond(ctx: Context<ClaimBond>) -> ProgramResult {
        instructions::claim_bond::handler(ctx)
    }

    pub fn change_fee(ctx: Context<ChangeFee>, new_fee: u128) -> ProgramResult {
        instructions::change_fee::handler(ctx, new_fee)
    }

    pub fn withdraw_fee(ctx: Context<WithdrawFee>) -> ProgramResult {
        instructions::withdraw_fee::handler(ctx)
    }
}
