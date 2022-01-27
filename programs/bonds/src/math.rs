use std::convert::TryInto;

use crate::structs::{BondSale, Decimal, TokenAmount};

#[allow(dead_code)]
pub fn calculate_new_price(
    bond_sale: &mut BondSale,
    current_time: u64,
    buy_amount: TokenAmount,
) -> Decimal {
    let delta_time: u64 = current_time - bond_sale.last_trade;
    let time_ratio: Decimal = Decimal::from_integer(delta_time.try_into().unwrap())
        / Decimal::from_integer(bond_sale.sale_time.try_into().unwrap());

    let delta_price: Decimal =
        bond_sale.velocity * bond_sale.up_bound * bond_sale.floor_price * time_ratio;
    let supply_ratio: Decimal = buy_amount.percent(bond_sale.bond_amount);

    let price: Decimal =
        match { bond_sale.previous_price } < { bond_sale.floor_price + delta_price } {
            true => bond_sale.floor_price,
            false => bond_sale.previous_price - delta_price,
        };
    let jump: Decimal = supply_ratio * bond_sale.up_bound * bond_sale.floor_price;

    bond_sale.previous_price = price + jump;
    bond_sale.remaining_amount = bond_sale.remaining_amount - buy_amount;

    price + Decimal::from_decimal(50, 2) * jump
}

#[allow(dead_code)]
pub fn calculate_bond_to_quote_price(
    // how many bond tokens correspond to quote tokens
    // without BondSale update
    bond_sale: &mut BondSale,
    current_time: u64,
    buy_amount: TokenAmount,
) -> Decimal {
    let delta_time: u64 = current_time - bond_sale.last_trade;
    let time_ratio: Decimal = Decimal::from_integer(delta_time.try_into().unwrap())
        / Decimal::from_integer(bond_sale.sale_time.try_into().unwrap());

    let delta_price: Decimal =
        bond_sale.velocity * bond_sale.up_bound * bond_sale.floor_price * time_ratio;
    let supply_ratio: Decimal = buy_amount.percent(bond_sale.bond_amount);

    let price: Decimal =
        match { bond_sale.previous_price } < { bond_sale.floor_price + delta_price } {
            true => bond_sale.floor_price,
            false => bond_sale.previous_price - delta_price,
        };
    let jump: Decimal = supply_ratio * bond_sale.up_bound * bond_sale.floor_price;

    price + Decimal::from_decimal(50, 2) * jump
}

// TODO quote_to_bond func and bond_to_quote
#[allow(dead_code)]
pub fn calculate_bond_to_quote_price(
    // how many quote tokens correspond to bond tokens
    bond_sale: &mut BondSale,
    current_time: u64,
    buy_amount: TokenAmount,
) -> Decimal {
    if buy_amount.v == 0 {
        let delta_time: u64 = current_time - bond_sale.last_trade;
        let time_ratio: Decimal = Decimal::from_integer(delta_time.try_into().unwrap())
            / Decimal::from_integer(bond_sale.sale_time.try_into().unwrap());

        let delta_price: Decimal =
            bond_sale.velocity * bond_sale.up_bound * bond_sale.floor_price * time_ratio;

        let price: Decimal =
            match { bond_sale.previous_price } < { bond_sale.floor_price + delta_price } {
                true => bond_sale.floor_price,
                false => bond_sale.previous_price - delta_price,
            };

        Decimal::one().div_up(price)
    } else {
        Decimal::one()
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    #[should_panic]
    fn test_panic_calculate_new_price() {
        let nonpanic_bond_sale = BondSale {
            previous_price: Decimal::from_integer(2),
            up_bound: Decimal::from_decimal(50, 2),
            velocity: Decimal::one(),
            bond_amount: TokenAmount::new(50),
            remaining_amount: TokenAmount::new(20),
            quote_amount: TokenAmount::new(25),
            sale_time: 604800, // second in a week
            last_trade: 0,
            ..Default::default()
        };

        // supply cannot be equal to 0
        {
            let mut bond_sale = BondSale {
                bond_amount: TokenAmount::new(0),
                ..nonpanic_bond_sale
            };
            calculate_new_price(&mut bond_sale, 20, TokenAmount::new(2));
        }
        // velocity should be grater than 0
        {
            let mut bond_sale = BondSale {
                velocity: Decimal::new(0),
                ..nonpanic_bond_sale
            };
            calculate_new_price(&mut bond_sale, 20, TokenAmount::new(2));
        }
        // delta_time cannot be greater than sale_time
        {
            let mut bond_sale = BondSale {
                last_trade: 302400,
                ..nonpanic_bond_sale
            };
            calculate_new_price(&mut bond_sale, 302401, TokenAmount::new(2));
        }
        // buy_amount cannot be greater than remaining_amount
        {
            let mut bond_sale = BondSale {
                ..nonpanic_bond_sale
            };
            calculate_new_price(&mut bond_sale, 20, TokenAmount::new(20));
        }
    }

    #[test]
    fn test_calculate_new_price() {
        let nonpanic_bond_sale = BondSale {
            floor_price: Decimal::from_integer(2),
            previous_price: Decimal::from_integer(2),
            up_bound: Decimal::from_decimal(50, 2),
            velocity: Decimal::one(),
            bond_amount: TokenAmount::new(50),
            remaining_amount: TokenAmount::new(20),
            quote_amount: TokenAmount::new(25),
            sale_time: 604800, // seconds in a week
            last_trade: 0,
            ..Default::default()
        };
        /*
        10% of supply was taken
        ceil_price = x1.5 floor_price
        */
        {
            let mut bond_sale = BondSale {
                previous_price: Decimal::from_integer(2),
                up_bound: Decimal::from_decimal(50, 2),
                bond_amount: TokenAmount::new(100),
                remaining_amount: TokenAmount::new(20),
                ..nonpanic_bond_sale
            };

            let result = calculate_new_price(&mut bond_sale, 0, TokenAmount::new(10));

            let expected_result: Decimal = Decimal::from_decimal(205, 2);
            let expected_bond_sale_previous_price: Decimal = Decimal::from_decimal(210, 2);

            assert_eq!(result, expected_result);
            assert_eq!(
                { bond_sale.previous_price },
                expected_bond_sale_previous_price
            );
            assert_eq!({ bond_sale.remaining_amount }, TokenAmount::new(10));
        }
        // if delta_time = sale_time and buy_amount = 0, then trade_price = new_price = floor_price
        {
            let mut bond_sale = BondSale {
                bond_amount: TokenAmount::new(50),
                remaining_amount: TokenAmount::new(50),
                previous_price: Decimal::from_integer(3), // ==ceil price
                up_bound: Decimal::from_decimal(50, 2),
                velocity: Decimal::one(),
                floor_price: Decimal::from_integer(2),
                sale_time: 604800, // seconds in a week
                last_trade: 0,
                ..nonpanic_bond_sale
            };

            let result = calculate_new_price(&mut bond_sale, 604800, TokenAmount::new(0));

            let expected_result: Decimal = bond_sale.floor_price;
            let expected_bond_sale_previous_price: Decimal = bond_sale.floor_price;

            assert_eq!(result, expected_result);
            assert_eq!(
                { bond_sale.previous_price },
                expected_bond_sale_previous_price
            );
            assert_eq!({ bond_sale.remaining_amount }, TokenAmount::new(50));
        }
        // if delta_time = sale_time/2, doubled velocity and buy_amount = 0, then trade_price = new_price = floor_price
        {
            let mut bond_sale = BondSale {
                bond_amount: TokenAmount::new(100),
                remaining_amount: TokenAmount::new(50),
                previous_price: Decimal::from_integer(3), // ==ceil price
                up_bound: Decimal::from_decimal(50, 2),
                velocity: Decimal::from_integer(2),
                floor_price: Decimal::from_integer(2),
                sale_time: 302400, // half of seconds in a week
                last_trade: 0,
                ..nonpanic_bond_sale
            };

            let result = calculate_new_price(&mut bond_sale, 604800, TokenAmount::new(0));

            let expected_result: Decimal = bond_sale.floor_price;
            let expected_bond_sale_previous_price: Decimal = bond_sale.floor_price;

            assert_eq!(result, expected_result);
            assert_eq!(
                { bond_sale.previous_price },
                expected_bond_sale_previous_price
            );
            assert_eq!({ bond_sale.remaining_amount }, TokenAmount::new(50));
        }
        // instantly taken 100% of supply
        {
            let mut bond_sale = BondSale {
                bond_amount: TokenAmount::new(50),
                remaining_amount: TokenAmount::new(50),
                ..nonpanic_bond_sale
            };

            let result = calculate_new_price(&mut bond_sale, 0, TokenAmount::new(50));

            let expected_result: Decimal = Decimal::from_decimal(250, 2);
            let expected_bond_sale_previous_price: Decimal = Decimal::from_integer(3);

            assert_eq!(result, expected_result);
            assert_eq!(
                { bond_sale.previous_price },
                expected_bond_sale_previous_price
            );
            assert_eq!({ bond_sale.remaining_amount }, TokenAmount::new(0));
        }
        /*
        bond_amount = 1_000_000
        floor_price = 2
        sale_time = 1week
        up_bound = 300%
        velocity = 1
        Someone makes 28 trades proportionally each 6 hours
        */
        {
            let mut bond_sale = BondSale {
                bond_amount: TokenAmount::new(1_000_000),
                remaining_amount: TokenAmount::new(1_000_000),
                floor_price: Decimal::from_integer(2),
                sale_time: 604800,
                up_bound: Decimal::from_decimal(300, 2),
                velocity: Decimal::from_decimal(100, 2),
                ..Default::default()
            };
            let buy_amount: TokenAmount = TokenAmount::new(35714); // floor(1_000_000/28)
            let basic_time: u64 = 21600; //1week/28

            for n in 0..28 {
                let current_time = n * basic_time;
                let result = calculate_new_price(&mut bond_sale, current_time, buy_amount);

                let expected_result: Decimal = Decimal::new(2107142000000);
                let expected_bond_sale_previous_price: Decimal = Decimal::new(2214284000000);

                assert_eq!(result, expected_result);
                assert_eq!(
                    { bond_sale.previous_price },
                    expected_bond_sale_previous_price
                );
            }

            assert_eq!({ bond_sale.remaining_amount }, TokenAmount::new(8)); // 8 = 1_000_000 - 28 * 35714
        }
    }
}
