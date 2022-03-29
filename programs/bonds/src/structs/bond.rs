use std::convert::TryInto;

use anchor_lang::prelude::*;

use crate::{errors::Result, structs::Decimal};

use super::TokenAmount;

#[account(zero_copy)]
#[repr(packed)]
#[derive(Debug, Default)]
pub struct Bond {
    pub bond_sale: Pubkey,
    pub token_bond: Pubkey,
    pub owner: Pubkey,
    pub token_bond_account: Pubkey,
    pub authority: Pubkey,
    pub bond_amount: TokenAmount,
    pub last_claim: u64,
    pub vesting_start: u64,
    pub vesting_end: u64,
}

impl Bond {
    pub fn get_amount_to_claim(&mut self, current_time: u64) -> Result<TokenAmount> {
        require!(self.last_claim < self.vesting_end, VestingEnded);

        let time_delta = match current_time < self.vesting_end {
            true => current_time - self.last_claim,
            false => self.vesting_end - self.last_claim,
        };
        let duration = self.vesting_end - self.vesting_start;
        let fraction = Decimal::from_integer(time_delta.try_into().unwrap())
            / Decimal::from_integer(duration.try_into().unwrap());

        let amount_to_claim = self.bond_amount.big_mul(fraction).to_token_floor();
        Ok(amount_to_claim)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_amount_to_claim() {
        {
            let mut bond = Bond::default();
            bond.bond_amount = TokenAmount::new(100);
            bond.vesting_start = 0;
            bond.vesting_end = 10;
            bond.last_claim = 0;
            assert_eq!(bond.get_amount_to_claim(5).unwrap(), TokenAmount::new(50));
        }
        {
            let mut bond = Bond::default();
            bond.bond_amount = TokenAmount::new(99);
            bond.vesting_start = 0;
            bond.vesting_end = 10;
            bond.last_claim = 5;
            assert_eq!(bond.get_amount_to_claim(5).unwrap(), TokenAmount::new(0));
        }
        {
            let mut bond = Bond::default();
            bond.bond_amount = TokenAmount::new(1001);
            bond.vesting_start = 0;
            bond.vesting_end = 10;
            bond.last_claim = 5;
            assert_eq!(bond.get_amount_to_claim(10).unwrap(), TokenAmount::new(500));
        }
        {
            let mut bond = Bond::default();
            bond.bond_amount = TokenAmount::new(100);
            bond.vesting_start = 0;
            bond.vesting_end = 10;
            bond.last_claim = 5;
            assert_eq!(bond.get_amount_to_claim(15).unwrap(), TokenAmount::new(50));
        }
    }
}
