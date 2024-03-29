use anchor_lang::prelude::*;

use super::{Decimal, TokenAmount};

#[account(zero_copy)]
#[repr(packed)]
#[derive(Debug, Default)]
pub struct BondSale {
    pub token_bond: Pubkey,
    pub token_quote: Pubkey,
    pub token_bond_account: Pubkey,
    pub token_quote_account: Pubkey,
    pub payer: Pubkey,
    pub fee: Decimal,
    pub fee_amount: TokenAmount,
    pub floor_price: Decimal,
    pub previous_price: Decimal,
    pub up_bound: Decimal,
    pub velocity: Decimal,
    pub supply: TokenAmount,
    pub remaining_amount: TokenAmount,
    pub quote_amount: TokenAmount,
    pub end_time: u64,
    pub start_time: u64,
    pub last_trade: u64,
    pub vesting_time: u64,
    pub next_bond: u128,
    pub id: u128,
}

impl BondSale {
    pub fn calculate_ceil_price(&self) -> Decimal {
        (Decimal::one() + self.up_bound) * self.floor_price
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_ceil_price() {
        {
            let mut bond_sale = BondSale::default();
            bond_sale.floor_price = Decimal::from_integer(1);
            bond_sale.up_bound = Decimal::from_integer(2);
            assert_eq!(bond_sale.calculate_ceil_price(), Decimal::from_integer(3));
        }
    }
}
