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
