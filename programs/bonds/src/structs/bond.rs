use anchor_lang::prelude::*;

use super::TokenAmount;

#[account(zero_copy)]
#[repr(packed)]
#[derive(Debug, Default)]
pub struct Bond {
    pub bond_sale: Pubkey,
    pub owner: Pubkey,
    pub buy_amount: TokenAmount,
}
