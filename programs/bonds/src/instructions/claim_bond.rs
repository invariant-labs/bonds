use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{transfer, TokenAccount, Transfer};

use crate::structs::BondSale;
use crate::{
    get_signer,
    interfaces::TransferBond,
    structs::{Bond, State},
    utils::{close, get_current_timestamp},
    SEED,
};

#[derive(Accounts)]
pub struct ClaimBond<'info> {
    #[account(seeds = [b"statev1"], bump = state.load()?.bump)]
    pub state: AccountLoader<'info, State>,
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(mut)]
    pub bond: AccountLoader<'info, Bond>,
    #[account(mut,
        constraint = token_bond_account.key() == bond_sale.load()?.token_bond_account
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
        constraint = authority.key() == state.load()?.authority
    )]
    pub authority: AccountInfo<'info>,
    #[account(address = token::ID)]
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

pub fn handler(ctx: Context<ClaimBond>) -> ProgramResult {
    {
        let mut bond = ctx.accounts.bond.load_mut()?;
        let state = ctx.accounts.state.load()?;

        let current_time = get_current_timestamp();
        let amount_to_claim = bond.get_amount_to_claim(current_time).unwrap();
        bond.last_claim = current_time;

        let signer: &[&[&[u8]]] = get_signer!(state.nonce);
        transfer(
            ctx.accounts.transfer_bond().with_signer(signer),
            amount_to_claim.v,
        )?;
    }

    let mut bond = *ctx.accounts.bond.load_mut()?;
    if bond.last_claim > bond.vesting_end {
        bond = Default::default();
        close(
            ctx.accounts.bond.to_account_info(),
            ctx.accounts.owner.to_account_info(),
        )?;
    }

    Ok(())
}
