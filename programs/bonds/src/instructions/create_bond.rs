use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token;
use anchor_spl::token::{TokenAccount, Transfer};
use bond_sale::BondSale;

use crate::math::calculate_new_price;
use crate::utils::get_current_timestamp;
use crate::{
    interfaces::TransferQuote,
    structs::{bond_sale, token_amount::TokenAmount, Bond},
};

#[derive(Accounts)]
pub struct CreateBond<'info> {
    #[account(mut)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(zero)]
    pub bond: AccountLoader<'info, Bond>,
    #[account(mut,
        constraint = owner_quote_account.owner == owner.key(),
        constraint = owner_quote_account.mint == token_quote_account.mint
    )]
    pub owner_quote_account: Box<Account<'info, TokenAccount>>, 
    #[account(mut,
        constraint = token_bond_account.key() == bond_sale.load()?.token_bond_account 
    )]
    pub token_bond_account: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = token_quote_account.key() == bond_sale.load()?.token_quote_account
    )]
    pub token_quote_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> TransferQuote<'info> for CreateBond<'info> {
    fn transfer_quote(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.owner_quote_account.to_account_info(),
                to: self.token_quote_account.to_account_info(),
                authority: self.owner.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<CreateBond>, amount: u64, price_limit: u128) -> ProgramResult {
    let bond = &mut ctx.accounts.bond.load_init()?;
    let bond_sale = &mut ctx.accounts.bond_sale.load_mut()?;

    let current_time = get_current_timestamp();
    let sell_price = calculate_new_price(bond_sale, current_time, TokenAmount::new(amount));
    require!(sell_price.v.le(&price_limit), PriceLimitExceeded);

    require!(
        amount <= bond_sale.remaining_amount.v,
        InsufficientTokenAmount
    );
    let buy_amount = amount;
    let quote_amount = TokenAmount::new(amount).big_mul(sell_price).to_token_ceil();
    let fee = quote_amount.big_mul(bond_sale.fee).to_token_ceil();
    let quote_after_fee = quote_amount - fee;

    **bond = Bond {
        bond_sale: ctx.accounts.bond_sale.key(),
        token_bond: bond_sale.token_bond,
        owner: ctx.accounts.owner.key(),
        bond_amount: TokenAmount::new(buy_amount),
        last_claim: get_current_timestamp(),
        vesting_start: get_current_timestamp(),
        vesting_end: get_current_timestamp() + bond_sale.vesting_time,
        id: bond_sale.next_bond,
    };

    token::transfer(ctx.accounts.transfer_quote(), quote_amount.get())?;

    bond_sale.quote_amount += quote_after_fee;
    bond_sale.fee_amount += fee;
    bond_sale.next_bond += 1;

    Ok(())
}
