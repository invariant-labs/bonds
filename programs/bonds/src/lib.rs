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

declare_id!("A8jXJ4XTwjTo4yPoAWu8iiHHvoCM8c91NWBcjKsc886g");
pub const SEED: &str = "Bonds";

#[program]
pub mod bonds {
    use super::*;

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

    pub fn end_bond_sale(ctx: Context<EndBondSale>, nonce: u8) -> ProgramResult {
        instructions::end_bond_sale::handler(ctx, nonce)
    }

    pub fn change_velocity(ctx: Context<ChangeVelocity>, velocity: u128) -> ProgramResult {
        instructions::change_velocity::handler(ctx, velocity)
    }

    pub fn change_up_bound(ctx: Context<ChangeUpBound>, up_bound: u128) -> ProgramResult {
        instructions::change_up_bound::handler(ctx, up_bound)
    }

    pub fn claim_quote(ctx: Context<ClaimQuote>, nonce: u8) -> ProgramResult {
        instructions::claim_quote::handler(ctx, nonce)
    }

    pub fn claim_bond(ctx: Context<ClaimBond>, nonce: u8) -> ProgramResult {
        instructions::claim_bond::handler(ctx, nonce)
    }
}
