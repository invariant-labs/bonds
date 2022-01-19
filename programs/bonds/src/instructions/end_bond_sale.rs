use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, TokenAccount, Transfer};

use crate::{
    interfaces::TransferY,
    structs::{token_amount::TokenAmount, BondSale},
    utils::close,
};

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
    pub authority: AccountInfo<'info>,
    #[account(mut,
        constraint = payer.key() == bond_sale.load()?.payer
    )]
    pub payer: Signer<'info>,
    pub token_program: AccountInfo<'info>,
}

impl<'info> TransferY<'info> for EndBondSale<'info> {
    fn transfer_y(&self) -> CpiContext<'_, '_, '_, 'info, anchor_spl::token::Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.bond_sale_sell.to_account_info(),
                to: self.payer_y_account.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<EndBondSale>) -> ProgramResult {
    let mut bond_sale = ctx.accounts.bond_sale.load_mut()?;

    transfer(ctx.accounts.transfer_y(), bond_sale.sell_amount.0)?;
    bond_sale.sell_amount.0 = 0;

    close(
        ctx.accounts.bond_sale.to_account_info(),
        ctx.accounts.payer_y_account.to_account_info(),
    )?;
    Ok(())
}
