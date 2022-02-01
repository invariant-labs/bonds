use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, TokenAccount, Transfer};

use crate::{
    get_signer,
    interfaces::TransferBond,
    structs::{Bond, BondSale},
    utils::{close, get_current_timestamp},
    SEED,
};

#[derive(Accounts)]
pub struct ClaimBond<'info> {
    #[account(mut)]
    pub bond: AccountLoader<'info, Bond>,
    #[account(mut,
        constraint = token_bond_account.key() == bond.load()?.token_bond_account
    )]
    pub token_bond_account: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = owner_bond_account.owner == owner.key(),
        constraint = owner_bond_account.mint == token_bond_account.mint
    )]
    pub owner_bond_account: Account<'info, TokenAccount>,
    #[account(
        constraint = owner.key() == bond.load()?.owner
    )]
    pub owner: Signer<'info>,
    #[account(
        constraint = authority.key == &bond.load()?.authority
    )]
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

impl<'info> TransferBond<'info> for ClaimBond<'info> {
    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, anchor_spl::token::Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.token_bond_account.to_account_info(),
                to: self.owner_bond_account.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<ClaimBond>, nonce: u8) -> ProgramResult {
    {
        let mut bond = ctx.accounts.bond.load_mut()?;

        let current_time = get_current_timestamp();
        let amount_to_claim = bond.get_amount_to_claim(current_time).unwrap();
        bond.last_claim = current_time;

        let signer: &[&[&[u8]]] = get_signer!(nonce);
        transfer(
            ctx.accounts.transfer_bond().with_signer(signer),
            amount_to_claim.v,
        )?;
    }

    let bond = *ctx.accounts.bond.load()?;
    if bond.last_claim > bond.distribution_end {
        close(
            ctx.accounts.bond.to_account_info(),
            ctx.accounts.owner.to_account_info(),
        )?;
    }

    Ok(())
}
