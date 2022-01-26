use anchor_lang::prelude::*;
use anchor_spl::token::Transfer;
pub trait TransferBond<'info> {
    fn transfer_x(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>;
}

pub trait TransferQuote<'info> {
    fn transfer_y(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>;
}
