use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{transfer, TokenAccount, Transfer};

use crate::structs::{State, TokenAmount};
use crate::SEED;
use crate::{get_signer, interfaces::TransferQuote, structs::BondSale};

#[derive(Accounts)]
pub struct ClaimQuote<'info> {
    #[account(seeds = [b"statev1"], bump = state.load()?.bump)]
    pub state: AccountLoader<'info, State>,
    #[account(mut,
        constraint = bond_sale.load()?.payer == payer.key()
    )]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(mut,
        constraint = bond_sale_quote_account.mint == bond_sale.load()?.token_quote
    )]
    pub bond_sale_quote_account: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = payer_quote_account.mint == bond_sale.load()?.token_quote,
        constraint = payer_quote_account.owner == payer.key()
    )]
    pub payer_quote_account: Account<'info, TokenAccount>,
    pub payer: Signer<'info>,
    #[account(
        constraint = authority.key() == state.load()?.authority
    )]
    pub authority: AccountInfo<'info>,
    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
}

impl<'info> TransferQuote<'info> for ClaimQuote<'info> {
    fn transfer_quote(&self) -> CpiContext<'_, '_, '_, 'info, anchor_spl::token::Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.bond_sale_quote_account.to_account_info(),
                to: self.payer_quote_account.to_account_info(),
                authority: self.authority.clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<ClaimQuote>) -> ProgramResult {
    let mut bond_sale = ctx.accounts.bond_sale.load_mut()?;
    let state = ctx.accounts.state.load()?;

    let quote_amount = bond_sale.quote_amount;

    let signer: &[&[&[u8]]] = get_signer!(state.nonce);
    transfer(
        ctx.accounts.transfer_quote().with_signer(signer),
        quote_amount.v,
    )?;

    bond_sale.quote_amount = TokenAmount::new(0);

    Ok(())
}
