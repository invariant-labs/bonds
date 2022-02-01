use std::convert::TryInto;

use anchor_lang::prelude::*;

use crate::{errors::Result, structs::Decimal};

use super::TokenAmount;

#[account(zero_copy)]
#[repr(packed)]
#[derive(Debug, Default)]
pub struct Bond {
    pub bond_sale: Pubkey,
    pub owner: Pubkey,
    pub buy_amount: TokenAmount,
    pub last_claim: u64,
    pub distribution_end: u64,
}

impl Bond {
    pub fn get_amount_to_claim(&mut self, duration: u64, current_time: u64) -> Result<TokenAmount> {
        require!(self.last_claim < self.distribution_end, DistributionEnded);

        let time_delta = match current_time < self.distribution_end {
            true => current_time - self.last_claim,
            false => self.distribution_end - self.last_claim,
        };
        let fraction = Decimal::from_integer(time_delta.try_into().unwrap())
            / Decimal::from_integer(duration.try_into().unwrap());

        let amount_to_claim = self.buy_amount.big_mul(fraction).to_token_floor();
        Ok(amount_to_claim)
    }
}
