use anchor_lang::prelude::*;

use crate::utils::get_current_timestamp;

use super::{Decimal, TokenAmount};

#[account(zero_copy)]
#[repr(packed)]
pub struct BondSale {
    pub token_buy: Pubkey,
    pub token_sell: Pubkey,
    pub token_buy_account: Pubkey,
    pub token_sell_account: Pubkey,
    pub payer: Pubkey,
    pub authority: Pubkey,
    pub floor_price: Decimal,
    pub previous_price: Decimal,
    pub up_bound: Decimal,
    pub velocity: Decimal,
    pub buy_amount: TokenAmount,
    pub remaining_amount: TokenAmount,
    pub sell_amount: TokenAmount,
    pub sale_time: u64,
    pub last_trade: u64,
}

impl BondSale {
    pub fn calculate_ceil_price(&self) -> Decimal {
        (Decimal::one() + self.up_bound) * self.floor_price
    }

    pub fn update_amounts(&mut self, buy_amount: u64, sell_amount: u64) {
        self.last_trade = get_current_timestamp();
        self.remaining_amount = self.remaining_amount - TokenAmount::new(buy_amount);
        self.sell_amount = self.sell_amount + TokenAmount::new(sell_amount);
    }
}
