use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, TokenAccount, Transfer};

use crate::{
    get_signer,
    interfaces::{TransferBond, TransferQuote},
    structs::BondSale,
    utils::close,
    SEED,
};

#[derive(Accounts)]
pub struct EndBondSale<'info> {
    #[account(mut)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(mut,
        constraint = token_quote_account.key() == bond_sale.load()?.token_quote_account
    )]
    pub token_quote_account: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = token_bond_account.key() == bond_sale.load()?.token_bond_account
    )]
    pub token_bond_account: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = &payer_quote_account.owner == payer.key,
        constraint = payer_quote_account.mint == bond_sale.load()?.token_quote
    )]
    pub payer_quote_account: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = &payer_bond_account.owner == payer.key,
        constraint = payer_bond_account.mint == bond_sale.load()?.token_bond
    )]
    pub payer_bond_account: Account<'info, TokenAccount>,
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

impl<'info> TransferBond<'info> for EndBondSale<'info> {
    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, anchor_spl::token::Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.token_bond_account.to_account_info(),
                to: self.payer_bond_account.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<EndBondSale>, nonce: u8) -> ProgramResult {
    let mut bond_sale = *ctx.accounts.bond_sale.load_mut()?;
    {
        let signer: &[&[&[u8]]] = get_signer!(nonce);
        transfer(
            ctx.accounts.transfer_quote().with_signer(signer),
            bond_sale.quote_amount.v,
        )?;
        if bond_sale.remaining_amount.v != 0 {
            transfer(
                ctx.accounts.transfer_bond().with_signer(signer),
                bond_sale.remaining_amount.v,
            )?;
        }
    }
    close(
        ctx.accounts.bond_sale.to_account_info(),
        ctx.accounts.payer_quote_account.to_account_info(),
    )?;
    Ok(())
}
