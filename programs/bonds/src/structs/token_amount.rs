use crate::structs::decimal::{Decimal, DENOMINATOR};
use crate::uint::U256;
use anchor_lang::prelude::*;
use std::ops::{Add, Sub};

#[zero_copy]
#[derive(Default, Debug, PartialEq, Eq, PartialOrd, Ord, AnchorDeserialize, AnchorSerialize)]

pub struct TokenAmount {
    pub v: u64,
}

impl TokenAmount {
    pub fn new(amount: u64) -> Self {
        TokenAmount { v: amount }
    }

    pub fn is_zero(&self) -> bool {
        self.v == 0
    }

    // this is a lossless operation so no 'up' version needed
    pub fn big_mul(self, other: Decimal) -> Decimal {
        Decimal::new(
            U256::from(self.v)
                .checked_mul(U256::from(other.v))
                .unwrap()
                .as_u128(),
        )
    }

    pub fn big_div(self, other: Decimal) -> Decimal {
        Decimal::new(
            U256::from(self.v)
                .checked_mul(U256::from(DENOMINATOR.checked_mul(DENOMINATOR).unwrap()))
                .unwrap()
                .checked_div(U256::from(other.v))
                .unwrap()
                .as_u128(),
        )
    }

    pub fn big_div_up(self, other: Decimal) -> Decimal {
        Decimal::new(
            U256::from(self.v)
                .checked_mul(U256::from(DENOMINATOR.checked_mul(DENOMINATOR).unwrap()))
                .unwrap()
                .checked_add(U256::from(other.v.checked_sub(1).unwrap()))
                .unwrap()
                .checked_div(U256::from(other.v))
                .unwrap()
                .as_u128(),
        )
    }

    pub fn percent(&self, other: Self) -> Decimal {
        Decimal::new(
            U256::from(self.v)
                .checked_mul(U256::from(DENOMINATOR))
                .unwrap()
                .checked_div(U256::from(other.v))
                .unwrap()
                .as_u128(),
        )
    }
}

impl Add for TokenAmount {
    type Output = TokenAmount;

    fn add(self, other: TokenAmount) -> TokenAmount {
        TokenAmount {
            v: self.v.checked_add(other.v).unwrap(),
        }
    }
}

impl Sub for TokenAmount {
    type Output = TokenAmount;

    fn sub(self, other: TokenAmount) -> TokenAmount {
        TokenAmount {
            v: self.v.checked_sub(other.v).unwrap(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_big_mul() {
        // precision
        {
            let a = TokenAmount::new(1);
            let b = Decimal::from_integer(1);
            let c = a.big_mul(b);
            assert_eq!(c, Decimal::from_integer(1));
        }
        // simple
        {
            let a = TokenAmount::new(2);
            let b = Decimal::from_integer(3);
            let c = a.big_mul(b);
            assert_eq!(c, Decimal::from_integer(6));
        }
        // big
        {
            let a = TokenAmount::new(1);
            let b = Decimal::new(2u128.pow(127));
            let c = a.big_mul(b);
            assert_eq!(c, b);
        }
        // random
        {
            let a = TokenAmount::new(982383286787);
            let b = Decimal::new(87932487422289);
            let c = a.big_mul(b);
            // 87932487422289 * 982383286787
            assert_eq!(c, Decimal::new(86383406009264805062995443));
        }
    }

    #[test]
    fn test_big_div() {
        {
            let a = TokenAmount::new(1);
            let b = Decimal::from_integer(1000000000000);
            assert_eq!(a.big_div(b), Decimal::new(1));
        }
        {
            let a = TokenAmount::new(111);
            let b = Decimal::from_integer(37);
            assert_eq!(a.big_div(b), Decimal::from_integer(3));
            assert_eq!(a.big_div_up(b), Decimal::from_integer(3));
        }
        {
            let a = TokenAmount::new(1);
            let b = Decimal::from_integer(3);
            assert_eq!(a.big_div(b), Decimal::new(333333333333));
            assert_eq!(a.big_div_up(b), Decimal::new(333333333334));
        }
    }

    #[test]
    fn ops() {
        // Add
        {
            assert_eq!(
                TokenAmount::new(0) + TokenAmount::new(0),
                TokenAmount::new(0)
            );
            assert_eq!(
                TokenAmount::new(10000000000) + TokenAmount::new(2345678910),
                TokenAmount::new(12345678910)
            );
        }
        // Sub
        {
            assert_eq!(
                TokenAmount::new(0) + TokenAmount::new(0),
                TokenAmount::new(0)
            );
            assert_eq!(
                TokenAmount::new(12345678910) - TokenAmount::new(2345678910),
                TokenAmount::new(10000000000)
            );
        }
    }
}
