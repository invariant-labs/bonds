use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token;
use anchor_spl::token::{Mint, TokenAccount, Transfer};
use bond_sale::BondSale;

use crate::math::calculate_new_price;
use crate::utils::get_current_timestamp;
use crate::{
    interfaces::TransferQuote,
    structs::{bond_sale, token_amount::TokenAmount, Bond},
};

#[derive(Accounts)]
pub struct CreateBond<'info> {
    #[account(mut,
        constraint = bond_sale.load()?.token_bond == token_bond.key(),
        constraint = bond_sale.load()?.token_quote == token_quote.key()
    )]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(zero)]
    pub bond: AccountLoader<'info, Bond>,
    pub token_bond: Box<Account<'info, Mint>>,
    pub token_quote: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub owner_quote_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_bond_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_quote_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub authority: AccountInfo<'info>,
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

pub fn handler(ctx: Context<CreateBond>, amount: u64, by_amount_in: bool) -> ProgramResult {
    let bond = &mut ctx.accounts.bond.load_init()?;
    let bond_sale = &mut ctx.accounts.bond_sale.load_mut()?;

    let current_time = get_current_timestamp();
    let sell_price = calculate_new_price(bond_sale, current_time, TokenAmount::new(amount));

    let mut buy_amount = 0;
    let mut quote_amount = 0;

    // To be implemented, waiting for a math equation
    if by_amount_in {
    } else {
        require!(
            amount <= bond_sale.remaining_amount.v,
            InsufficientTokenAmount
        );
        buy_amount = amount;
        quote_amount = TokenAmount::new(amount)
            .big_mul(sell_price)
            .to_token_ceil()
            .v;
    }

    **bond = Bond {
        token_bond: ctx.accounts.token_bond.key(),
        token_bond_account: ctx.accounts.token_bond_account.key(),
        owner: ctx.accounts.owner.key(),
        authority: ctx.accounts.authority.key(),
        buy_amount: TokenAmount::new(buy_amount),
        last_claim: get_current_timestamp(),
        distribution_start: get_current_timestamp(),
        distribution_end: get_current_timestamp() + bond_sale.distribution,
    };

    token::transfer(ctx.accounts.transfer_quote(), quote_amount)?;

    bond_sale.quote_amount = bond_sale.quote_amount + TokenAmount::new(quote_amount);
    Ok(())
}
