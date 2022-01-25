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
use structs::*;
use utils::*;

declare_id!("R9PatsTac3Y3UpC7ihYMMgzAQCe1tXnVvkSQ8DtLWUc");
pub const SEED: &str = "Bonds";

#[program]
pub mod bonds {
    use super::*;

    pub fn init_bond_sale(
        ctx: Context<InitBondSale>,
        floor_price: u128,
        up_bound: u128,
        velocity: u128,
        buy_amount: u64,
        end_time: u64,
    ) -> ProgramResult {
        instructions::init_bond_sale::handler(
            ctx,
            floor_price,
            up_bound,
            velocity,
            buy_amount,
            end_time,
        )
    }

    pub fn create_bond(
        ctx: Context<CreateBond>,
        buy_amount: u64,
        sell_amount: u64,
        bump: u8,
    ) -> ProgramResult {
        instructions::create_bond::handler(ctx, buy_amount, sell_amount, bump)
    }

    pub fn end_bond_sale(ctx: Context<EndBondSale>) -> ProgramResult {
        instructions::end_bond_sale::handler(ctx)
    }
}
