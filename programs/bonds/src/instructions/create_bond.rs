use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token;
use anchor_spl::token::{Mint, TokenAccount, Transfer};
use bond_sale::BondSale;

use crate::{
    interfaces::{TransferBond, TransferQuote},
    structs::{bond_sale, token_amount::TokenAmount, Bond},
};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateBond<'info> {
    #[account(zero)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(init, seeds = [b"bondv1", owner.key().as_ref(), bond_sale.key().as_ref(),], payer = owner, bump = bump)]
    pub bond: AccountLoader<'info, Bond>,
    pub token_bond: Box<Account<'info, Mint>>,
    pub token_quote: Box<Account<'info, Mint>>,
    #[account(init,
        token::mint = token_bond,
        token::authority = authority,
        payer = owner,
        constraint = bond_account.mint == token_bond.key()
    )]
    pub bond_account: Box<Account<'info, TokenAccount>>,
    #[account(init,
        token::mint = token_quote,
        token::authority = authority,
        payer = owner,
        constraint = quote_account.mint == token_quote.key()
    )]
    pub quote_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub bond_sale_bond_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub bond_sale_quote_account: Box<Account<'info, TokenAccount>>,
    pub owner: Signer<'info>,
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> TransferBond<'info> for CreateBond<'info> {
    fn transfer_x(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
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
    fn transfer_y(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.quote_account.to_account_info(),
                to: self.bond_sale_quote_account.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(
    ctx: Context<CreateBond>,
    buy_amount: u64,
    quote_amount: u64,
    bump: u8,
) -> ProgramResult {
    let bond = &mut ctx.accounts.bond.load_init()?;
    let bond_sale = &mut ctx.accounts.bond_sale.load_mut()?;

    require!(
        buy_amount <= bond_sale.remaining_amount.v,
        InsufficientTokenAmount
    );

    **bond = Bond {
        bond_sale: ctx.accounts.bond_sale.key(),
        owner: ctx.accounts.owner.key(),
        buy_amount: TokenAmount::new(buy_amount),
        bump,
    };

    token::transfer(ctx.accounts.transfer_x(), buy_amount)?;
    token::transfer(ctx.accounts.transfer_y(), quote_amount)?;

    bond_sale.remaining_amount = bond_sale.remaining_amount - TokenAmount::new(buy_amount);
    bond_sale.quote_amount = bond_sale.quote_amount + TokenAmount::new(quote_amount);
    Ok(())
}
