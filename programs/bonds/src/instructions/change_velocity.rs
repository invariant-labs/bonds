use anchor_lang::prelude::*;

use crate::structs::{BondSale, Decimal};

#[derive(Accounts)]
pub struct ChangeVelocity<'info> {
    #[account(mut)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(
        constraint = payer.key() == bond_sale.load()?.payer
    )]
    pub payer: Signer<'info>,
}

pub fn handler(ctx: Context<ChangeVelocity>, velocity: u128) -> ProgramResult {
    let mut bond_sale = ctx.accounts.bond_sale.load_mut()?;
    bond_sale.velocity = Decimal::new(velocity);

    Ok(())
}
