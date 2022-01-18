use std::cmp::Ordering;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Transfer};
use anchor_spl::token::{Mint, TokenAccount};

use crate::interfaces::TransferX;
use crate::{
    structs::{BondSale, Decimal, TokenAmount},
    utils::get_current_timestamp,
};

#[derive(Accounts)]
pub struct InitBondSale<'info> {
    #[account(zero)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(init, mint::decimals = 6, mint::authority = authority, payer = payer)]
    pub token_buy: Account<'info, Mint>,
    #[account(init, mint::decimals = 6, mint::authority = authority, payer = payer)]
    pub token_sell: Account<'info, Mint>,
    #[account(init, token::mint = token_buy, token::authority = authority, payer = payer)]
    pub bond_sale_buy: Account<'info, TokenAccount>,
    #[account(init, token::mint = token_sell, token::authority = authority, payer = payer)]
    pub bond_sale_sell: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer_x_account: Account<'info, TokenAccount>,
    pub payer: Signer<'info>,
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> TransferX<'info> for InitBondSale<'info> {
    fn transfer_x(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.payer_x_account.to_account_info(),
                to: self.bond_sale_buy.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

// trunk-ignore(clippy/too_many_arguments)
pub fn handler(
    ctx: Context<InitBondSale>,
    floor_price: Decimal,
    up_bound: Decimal,
    velocity: Decimal,
    buy_amount: u64,
    end_time: u64,
    nonce: u8,
) -> ProgramResult {
    let bond_sale = &mut ctx.accounts.bond_sale.load_mut()?;

    let token_buy_address = ctx.accounts.token_buy.to_account_info().key;
    let token_sell_address = ctx.accounts.token_sell.to_account_info().key;
    require!(
        token_buy_address
            .to_string()
            .cmp(&token_sell_address.to_string())
            == Ordering::Less,
        InvalidPoolTokenAddresses
    );

    let current_timestamp = get_current_timestamp();

    **bond_sale = BondSale {
        token_buy: token_buy_address.key(),
        token_sell: token_sell_address.key(),
        token_buy_account: ctx.accounts.bond_sale_buy.key(),
        token_sell_account: ctx.accounts.bond_sale_sell.key(),
        payer: ctx.accounts.payer.key(),
        floor_price,
        up_bound,
        velocity,
        buy_amount: TokenAmount::new(buy_amount),
        remaining_amount: TokenAmount::new(buy_amount),
        sell_amount: TokenAmount::new(0),
        sale_time: current_timestamp.checked_add(end_time).unwrap(),
        nonce,
    };

    token::transfer(ctx.accounts.transfer_x(), buy_amount);
    Ok(())
}
