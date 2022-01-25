use anchor_lang::prelude::*;

use super::{Decimal, TokenAmount};

#[account(zero_copy)]
#[repr(packed)]
pub struct BondSale {
    pub token_bond: Pubkey,
    pub token_quote: Pubkey,
    pub token_bond_account: Pubkey,
    pub token_quote_account: Pubkey,
    pub payer: Pubkey,
    pub authority: Pubkey,
    pub floor_price: Decimal,
    pub up_bound: Decimal,
    pub velocity: Decimal,
    pub bond_amount: TokenAmount,
    pub remaining_amount: TokenAmount,
    pub quote_amount: TokenAmount,
    pub sale_time: u64,
}

impl BondSale {
    pub fn calculate_ceil_price(&self) -> Decimal {
        (Decimal::one() + self.up_bound) * self.floor_price
    }
}
