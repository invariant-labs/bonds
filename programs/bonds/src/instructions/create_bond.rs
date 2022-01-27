use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token;
use anchor_spl::token::{Mint, TokenAccount, Transfer};
use bond_sale::BondSale;

use crate::get_signer;
use crate::math::calculate_new_price;
use crate::utils::get_current_timestamp;
use crate::SEED;
use crate::{
    interfaces::{TransferBond, TransferQuote},
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
    #[account(init,
        token::mint = token_bond,
        token::authority = authority,
        payer = owner,
    )]
    pub bond_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub owner_quote_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub bond_sale_bond_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub bond_sale_quote_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> TransferBond<'info> for CreateBond<'info> {
    fn transfer_bond(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.bond_sale_bond_account.to_account_info(),
                to: self.bond_account.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

impl<'info> TransferQuote<'info> for CreateBond<'info> {
    fn transfer_quote(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.owner_quote_account.to_account_info(),
                to: self.bond_sale_quote_account.to_account_info(),
                authority: self.owner.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(
    ctx: Context<CreateBond>,
    amount: u64,
    by_amount_in: bool,
    nonce: u8,
) -> ProgramResult {
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
        bond_sale: ctx.accounts.bond_sale.key(),
        bond_account: ctx.accounts.bond_account.key(),
        owner: ctx.accounts.owner.key(),
        buy_amount: TokenAmount::new(amount),
    };

    let signer: &[&[&[u8]]] = get_signer!(nonce);
    token::transfer(ctx.accounts.transfer_bond().with_signer(signer), buy_amount)?;
    token::transfer(ctx.accounts.transfer_quote(), quote_amount)?;

    bond_sale.quote_amount = bond_sale.quote_amount + TokenAmount::new(quote_amount);
    Ok(())
}
