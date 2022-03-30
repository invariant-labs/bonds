use anchor_lang::prelude::*;

#[account(zero_copy)]
#[repr(packed)]
#[derive(Debug, Default)]
pub struct State {
    pub admin: Pubkey,
    pub authority: Pubkey,
    pub nonce: u8,
    pub bump: u8,
}
