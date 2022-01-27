use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, TokenAccount, Transfer};

use crate::{interfaces::TransferQuote, structs::BondSale, utils::close};

#[derive(Accounts)]
pub struct EndBondSale<'info> {
    #[account(zero)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(
        constraint = token_quote.key() == bond_sale.load()?.token_quote
    )]
    pub token_quote: Account<'info, Mint>,
    #[account(mut,
        constraint = token_quote_account.key() == bond_sale.load()?.token_quote_account,
        constraint = token_quote_account.mint == token_quote.key(),
    )]
    pub token_quote_account: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = payer_quote_account.mint == token_quote.key(),
        constraint = &payer_quote_account.owner == payer.key
    )]
    pub payer_quote_account: Account<'info, TokenAccount>,
    pub authority: AccountInfo<'info>,
    #[account(mut,
        constraint = payer.key() == bond_sale.load()?.payer
    )]
    pub payer: Signer<'info>,
    pub token_program: AccountInfo<'info>,
}

impl<'info> TransferQuote<'info> for EndBondSale<'info> {
    fn transfer_quote(&self) -> CpiContext<'_, '_, '_, 'info, anchor_spl::token::Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.token_quote_account.to_account_info(),
                to: self.payer_quote_account.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<EndBondSale>) -> ProgramResult {
    let mut bond_sale = ctx.accounts.bond_sale.load_mut()?;

    transfer(ctx.accounts.transfer_quote(), bond_sale.quote_amount.v)?;
    bond_sale.quote_amount.v = 0;

    close(
        ctx.accounts.bond_sale.to_account_info(),
        ctx.accounts.payer_quote_account.to_account_info(),
    )?;
    Ok(())
}
