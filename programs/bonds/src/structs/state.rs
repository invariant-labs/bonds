use anchor_lang::prelude::*;

#[account(zero_copy)]
#[repr(packed)]
#[derive(Debug, Default)]
pub struct State {
    pub admin: Pubkey,
    pub authority: Pubkey,
    pub next_bond_sale: u128,
    pub nonce: u8,
    pub bump: u8,
}
