use anchor_lang::prelude::*;

use crate::structs::{BondSale, Decimal, State};

#[derive(Accounts)]
pub struct ChangeFee<'info> {
    #[account(seeds = [b"statev1"], bump = state.load()?.bump)]
    pub state: AccountLoader<'info, State>,
    #[account(mut)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(
        constraint = admin.key() == state.load()?.admin,
    )]
    pub admin: Signer<'info>,
}

pub fn handler(ctx: Context<ChangeFee>, new_fee: u128) -> ProgramResult {
    let mut bond_sale = ctx.accounts.bond_sale.load_mut()?;

    bond_sale.fee = Decimal::new(new_fee);
    Ok(())
}
