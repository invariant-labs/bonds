use std::convert::TryInto;

use crate::{
    structs::{Bond, BondSale, Decimal, TokenAmount},
    utils::get_current_timestamp,
};

pub fn calculate_new_price(
    bond_sale: &mut BondSale,
    current_time: u64,
    buy_amount: TokenAmount,
) -> Decimal {
    let delta_time: u64 = current_time - bond_sale.last_trade;
    let time_ratio: Decimal = Decimal::from_integer(delta_time.try_into().unwrap())
        / Decimal::from_integer(bond_sale.sale_time.try_into().unwrap());

    let delta_price: Decimal = bond_sale.velocity * bond_sale.up_bound * time_ratio;
    let supply_ratio: Decimal = buy_amount.percent(bond_sale.buy_amount);

    let price: Decimal = match bond_sale.previous_price < bond_sale.floor_price + delta_price {
        true => bond_sale.floor_price,
        false => bond_sale.previous_price - delta_price,
    };
    let jump: Decimal = supply_ratio * bond_sale.up_bound * bond_sale.floor_price;

    bond_sale.previous_price = price + jump;

    price + Decimal::from_decimal(50, 2) * jump
}

#[cfg(test)]
mod tests {

    use std::default;

    use super::*;

    #[test]
    #[should_panic]
    fn test_panic_calculate_new_price() {
        let nonpanic_bond_sale = BondSale {
            previous_price: Decimal::from_integer(2),
            up_bound: Decimal::from_decimal(50, 2),
            velocity: Decimal::one(),
            buy_amount: TokenAmount(50),
            remaining_amount: TokenAmount(20),
            sell_amount: TokenAmount(25),
            sale_time: 604800, // second in a week
            last_trade: 0,
            ..Default::default()
        };

        // supply cannot be equal to 0
        {
            let mut bond_sale = BondSale {
                buy_amount: TokenAmount(0),
                ..nonpanic_bond_sale
            };
            calculate_new_price(&mut bond_sale, 20, TokenAmount(2));
        }
        // velocity should be grater than 0
        {
            let mut bond_sale = BondSale {
                velocity: Decimal::new(0),
                ..nonpanic_bond_sale
            };
            calculate_new_price(&mut bond_sale, 20, TokenAmount(2));
        }
        // delta_time cannot be greater than sale_time
        {
            let mut bond_sale = BondSale {
                last_trade: 302400,
                ..nonpanic_bond_sale
            };
            calculate_new_price(&mut bond_sale, 302401, TokenAmount(2));
        }
        // buy_amount cannot be greater than remaining_amount
        {
            let mut bond_sale = BondSale {
                ..nonpanic_bond_sale
            };
            calculate_new_price(&mut bond_sale, 20, TokenAmount(20));
        }
    }

    #[test]
    fn test_calculate_new_price() {
        let nonpanic_bond_sale = BondSale {
            floor_price: Decimal::from_integer(2),
            previous_price: Decimal::from_integer(2),
            up_bound: Decimal::from_decimal(50, 2),
            velocity: Decimal::one(),
            buy_amount: TokenAmount(50),
            remaining_amount: TokenAmount(20),
            sell_amount: TokenAmount(25),
            sale_time: 604800, // second in a week
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
                buy_amount: TokenAmount(100),
                ..nonpanic_bond_sale
            };

            let result = calculate_new_price(&mut bond_sale, 0, TokenAmount(10));

            let expected_result: Decimal = Decimal::from_decimal(205, 2);
            let expected_bond_sale_previous_price: Decimal = Decimal::from_decimal(210, 2);

            assert_eq!(result, expected_result);
            assert_eq!(
                { bond_sale.previous_price },
                expected_bond_sale_previous_price
            );
        }
    }
}
