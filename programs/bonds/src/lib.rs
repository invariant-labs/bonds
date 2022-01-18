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
    use structs::Decimal;

    use super::*;

    // trunk-ignore(clippy/too_many_arguments)
    pub fn init_bond_sale(
        ctx: Context<InitBondSale>,
        floor_price: Decimal,
        up_bound: Decimal,
        velocity: Decimal,
        buy_amount: u64,
        sell_amount: u64,
        end_time: u64,
        nonce: u8,
    ) -> ProgramResult {
        instructions::init_bond_sale::handler(
            ctx,
            floor_price,
            up_bound,
            velocity,
            buy_amount,
            end_time,
            nonce,
        )
    }

    pub fn create_bond(
        ctx: Context<CreateBond>,
        buy_amount: u64,
        sell_amount: u64,
    ) -> ProgramResult {
        instructions::create_bond::handler(ctx, buy_amount, sell_amount)
    }
}
