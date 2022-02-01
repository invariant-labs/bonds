use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, TokenAccount, Transfer};

use crate::{
    get_signer,
    interfaces::TransferBond,
    structs::{Bond, BondSale},
    SEED,
};

#[derive(Accounts)]
pub struct ClaimBond<'info> {
    #[account(mut)]
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
        constraint = authority.key == &bond_sale.load()?.authority
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
    let mut bond = ctx.accounts.bond.load_mut()?;
    let mut bond_sale = ctx.accounts.bond_sale.load_mut()?;
    let amount_to_claim = bond.get_amount_to_claim(bond_sale.distribution).unwrap();

    let signer: &[&[&[u8]]] = get_signer!(nonce);
    transfer(
        ctx.accounts.transfer_bond().with_signer(signer),
        amount_to_claim.v,
    )?;

    Ok(())
}
