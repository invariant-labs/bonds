use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token;
use anchor_spl::token::{Mint, TokenAccount, Transfer};
use bond_sale::BondSale;

use crate::{
    interfaces::{TransferX, TransferY},
    structs::{bond_sale, token_amount::TokenAmount, Bond},
};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateBond<'info> {
    #[account(zero)]
    pub bond_sale: AccountLoader<'info, BondSale>,
    #[account(init, seeds = [b"bondv1", owner.key().as_ref(), bond_sale.key().as_ref(),], payer = owner, bump = bump)]
    pub bond: AccountLoader<'info, Bond>,
    pub token_buy: Account<'info, Mint>,
    pub token_sell: Account<'info, Mint>,
    #[account(init,
        token::mint = token_buy,
        token::authority = authority,
        payer = owner,
        constraint = bond_buy.mint == bond_sale_buy.mint
    )]
    pub bond_buy: Account<'info, TokenAccount>,
    #[account(init,
        token::mint = token_buy,
        token::authority = authority,
        payer = owner,
        constraint = bond_sell.mint == bond_sale_sell.mint)]
    pub bond_sell: Account<'info, TokenAccount>,
    #[account(mut)]
    pub bond_sale_buy: Account<'info, TokenAccount>,
    #[account(mut)]
    pub bond_sale_sell: Account<'info, TokenAccount>,
    pub owner: Signer<'info>,
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> TransferX<'info> for CreateBond<'info> {
    fn transfer_x(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.bond_sale_buy.to_account_info(),
                to: self.bond_buy.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

impl<'info> TransferY<'info> for CreateBond<'info> {
    fn transfer_y(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.bond_sale_buy.to_account_info(),
                to: self.bond_buy.to_account_info(),
                authority: self.authority.to_account_info().clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<CreateBond>, buy_amount: u64, sell_amount: u64) -> ProgramResult {
    let bond = &mut ctx.accounts.bond.load_init()?;
    let bond_sale = &mut ctx.accounts.bond_sale.load_mut()?;

    require!(
        buy_amount <= bond_sale.remaining_amount.0,
        InsufficientTokenAmount
    );

    **bond = Bond {
        bond_sale: ctx.accounts.bond_sale.key(),
        owner: ctx.accounts.owner.key(),
        buy_amount: TokenAmount(buy_amount),
    };

    token::transfer(ctx.accounts.transfer_x(), buy_amount)?;
    token::transfer(ctx.accounts.transfer_y(), sell_amount)?;

    bond_sale.remaining_amount = bond_sale.remaining_amount - TokenAmount::new(buy_amount);
    bond_sale.sell_amount = bond_sale.sell_amount + TokenAmount::new(sell_amount);
    Ok(())
}
