use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

use crate::structs::BondSale;

#[derive(Accounts)]
pub struct EndBondSale<'info> {
    #[account(zero)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(mut,
        constraint = bond_sale_sell.key() == bond_sale.load()?.token_sell_account,
        constraint = bond_sale_sell.mint == token_sell.key(),
    )]
    pub bond_sale_sell: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = payer_y_account.mint == token_sell.key(),
        constraint = &payer_y_account.owner == payer.key
    )]
    pub payer_y_account: Account<'info, TokenAccount>,
    #[account(
        constraint = token_sell.key() == bond_sale.load()?.token_sell
    )]
    pub token_sell: Account<'info, Mint>,
    #[account(
        constraint = &payer.key() == bond_sale.to_account_info().owner
    )]
    pub payer: Signer<'info>,
}
