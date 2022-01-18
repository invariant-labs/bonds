use anchor_lang::prelude::*;

use super::{Decimal, TokenAmount};

#[account(zero_copy)]
#[repr(packed)]
pub struct BondSale {
    pub token_buy: Pubkey,
    pub token_sell: Pubkey,
    pub token_buy_account: Pubkey,
    pub token_sell_account: Pubkey,
    pub payer: Pubkey,
    pub floor_price: Decimal,
    pub up_bound: Decimal,
    pub velocity: Decimal,
    pub buy_amount: TokenAmount,
    pub remaining_amount: TokenAmount,
    pub sell_amount: TokenAmount,
    pub sale_time: u64,
    pub nonce: u8,
}

impl Default for BondSale {
    fn default() -> BondSale {
        BondSale {
            token_buy: Pubkey::default(),
            token_sell: Pubkey::default(),
            token_buy_account: Pubkey::default(),
            token_sell_account: Pubkey::default(),
            payer: Pubkey::default(),
            floor_price: Decimal::default(),
            up_bound: Decimal::default(),
            velocity: Decimal::default(),
            buy_amount: TokenAmount(0),
            remaining_amount: TokenAmount(0),
            sell_amount: TokenAmount(0),
            sale_time: 0,
            nonce: 0,
        }
    }
}

impl BondSale {
    pub fn calculate_ceil_price(&self) -> Decimal {
        (Decimal::one() + self.up_bound) * self.floor_price
    }
}
