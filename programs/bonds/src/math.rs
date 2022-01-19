use std::convert::TryInto;

use crate::{
    structs::{Bond, BondSale, Decimal, TokenAmount},
    utils::get_current_timestamp,
};

pub fn calculate_new_price(
    bond_sale: BondSale,
    bond: &mut Bond,
    buy_amount: TokenAmount,
) -> Decimal {
    let fraction = bond_sale.velocity.big_div(Decimal::from_integer(
        bond_sale.sale_time.try_into().unwrap(),
    ));
    let time_diff = get_current_timestamp()
        .checked_sub(bond.last_trade)
        .unwrap();
    let price_increment =
        buy_amount.percent(bond_sale.buy_amount) * bond_sale.up_bound * bond_sale.floor_price;
    let slope = fraction * Decimal::from_integer(time_diff.try_into().unwrap());

    let temp = bond.current_price;
    let price;
    if slope.v.gt(&(price_increment + bond.previous_price).v) {
        price = bond_sale.floor_price;
    } else {
        price = std::cmp::max(
            bond_sale.floor_price,
            bond.previous_price + price_increment - slope,
        )
    }
    bond.update_previous_price(temp);

    price
}

pub fn calculate_new_price_safely(
    bond_sale: BondSale,
    bond: &mut Bond,
    buy_amount: TokenAmount,
    time_diff: u64,
) -> Decimal {
    let slope: Decimal =
        bond_sale.up_bound * bond_sale.velocity * Decimal::new(time_diff.try_into().unwrap());

    let bias: Decimal =
        bond_sale.floor_price * bond_sale.up_bound * buy_amount.percent(bond_sale.buy_amount);

    let temp: Decimal = match bond.previous_price.v.le(&(bond_sale.floor_price + slope).v) {
        true => bond_sale.floor_price,
        false => bond.previous_price - slope,
    };

    let price: Decimal = temp + Decimal::from_decimal(5, 2) * bias;

    bond.update_previous_price(price);

    price
}
