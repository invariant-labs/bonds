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
    let supply_ratio: Decimal = buy_amount.percent(bond_sale.sell_amount);

    let price: Decimal = match bond_sale.previous_price < bond_sale.floor_price + delta_price {
        true => bond_sale.floor_price,
        false => bond_sale.previous_price - delta_price,
    };
    let jump: Decimal = supply_ratio * bond_sale.up_bound * bond_sale.floor_price;

    bond_sale.previous_price = price + jump;

    price + Decimal::from_decimal(50, 2) * bond_sale.up_bound
}
