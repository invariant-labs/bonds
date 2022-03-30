use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};

use crate::{
    get_signer,
    interfaces::TransferQuote,
    structs::{BondSale, State, TokenAmount},
    SEED,
};

#[derive(Accounts)]
pub struct WithdrawFee<'info> {
    #[account(seeds = [b"statev1"], bump = state.load()?.bump)]
    pub state: AccountLoader<'info, State>,
    #[account(mut)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(mut,
        constraint = token_quote_account.key() == bond_sale.load()?.token_quote_account,
    )]
    pub token_quote_account: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = admin_quote_account.mint == token_quote_account.mint,
        constraint = admin_quote_account.owner == admin.key(),
    )]
    pub admin_quote_account: Account<'info, TokenAccount>,
    #[account(
        constraint = admin.key() == state.load()?.admin,
    )]
    pub admin: Signer<'info>,
    #[account(
        constraint = authority.key() == state.load()?.authority,
    )]
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

impl<'info> TransferQuote<'info> for WithdrawFee<'info> {
    fn transfer_quote(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.token_quote_account.to_account_info(),
                to: self.admin_quote_account.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<WithdrawFee>) -> ProgramResult {
    let state = ctx.accounts.state.load()?;
    let mut bond_sale = ctx.accounts.bond_sale.load_mut()?;

    let signer: &[&[&[u8]]] = get_signer!(state.nonce);

    token::transfer(
        ctx.accounts.transfer_quote().with_signer(signer),
        bond_sale.fee_amount.v,
    )?;

    bond_sale.fee_amount = TokenAmount::new(0);

    Ok(())
}
