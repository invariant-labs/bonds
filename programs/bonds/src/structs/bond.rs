use anchor_lang::prelude::*;

use crate::math::calculate_new_price;

use super::{Decimal, TokenAmount};

#[account(zero_copy)]
#[repr(packed)]
#[derive(Debug, Default)]
pub struct Bond {
    pub bond_sale: Pubkey,
    pub owner: Pubkey,
    pub current_price: Decimal,
    pub previous_price: Decimal,
    pub buy_amount: TokenAmount,
    pub last_trade: u64,
}

impl Bond {
    pub fn update_previous_price(&mut self, previous_price: Decimal) {
        self.previous_price = previous_price
    }

    pub fn update_current_price(&mut self, current_price: Decimal) {
        self.current_price = current_price
    }
}
