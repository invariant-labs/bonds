use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Transfer};
use anchor_spl::token::{Mint, TokenAccount};

use crate::interfaces::TransferBond;
use crate::structs::{BondSale, Decimal, State, TokenAmount};
use crate::utils::get_current_timestamp;

#[derive(Accounts)]
pub struct InitBondSale<'info> {
    #[account(seeds = [b"statev1"], bump = state.load()?.bump)]
    pub state: AccountLoader<'info, State>,
    #[account(zero)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    pub token_bond: Box<Account<'info, Mint>>,
    pub token_quote: Box<Account<'info, Mint>>,
    #[account(init,
        token::mint = token_bond,
        token::authority = authority,
        payer = payer
    )]
    pub token_bond_account: Box<Account<'info, TokenAccount>>,
    #[account(init,
        token::mint = token_quote,
        token::authority = authority,
        payer = payer
    )]
    pub token_quote_account: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = payer_bond_account.mint == token_bond.key(),
        constraint = payer_bond_account.owner == payer.key()
    )]
    pub payer_bond_account: Box<Account<'info, TokenAccount>>,
    #[account(
        constraint = payer_quote_account.mint == token_quote.key(),
        constraint = payer_quote_account.owner == payer.key()
    )]
    pub payer_quote_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        constraint = authority.key() == state.load()?.authority
    )]
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> TransferBond<'info> for InitBondSale<'info> {
    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.payer_bond_account.to_account_info(),
                to: self.token_bond_account.to_account_info(),
                authority: self.payer.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(
    ctx: Context<InitBondSale>,
    floor_price: u128,
    up_bound: u128,
    velocity: u128,
    supply: u64,
    duration: u64,
    vesting_time: u64,
) -> ProgramResult {
    let bond_sale = &mut ctx.accounts.bond_sale.load_init()?;

    let current_time = get_current_timestamp();
    let token_bond_address = &ctx.accounts.token_bond.key();
    let token_quote_address = &ctx.accounts.token_quote.key();

    **bond_sale = BondSale {
        token_bond: *token_bond_address,
        token_quote: *token_quote_address,
        token_bond_account: ctx.accounts.token_bond_account.key(),
        token_quote_account: ctx.accounts.token_quote_account.key(),
        payer: ctx.accounts.payer.key(),
        fee: Decimal::from_decimal(1, 1),
        fee_amount: TokenAmount::new(0),
        floor_price: Decimal::new(floor_price),
        previous_price: Decimal::new(floor_price),
        up_bound: Decimal::new(up_bound),
        velocity: Decimal::new(velocity),
        supply: TokenAmount::new(supply),
        remaining_amount: TokenAmount::new(supply),
        quote_amount: TokenAmount::new(0),
        end_time: current_time + duration,
        start_time: current_time,
        last_trade: current_time,
        vesting_time,
    };
    token::transfer(ctx.accounts.transfer_bond(), supply)?;
    Ok(())
}
