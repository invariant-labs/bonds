use anchor_lang::prelude::*;
use anchor_spl::token::Transfer;
pub trait TransferX<'info> {
    fn transfer_x(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>;
}

pub trait TransferY<'info> {
    fn transfer_y(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>>;
}
