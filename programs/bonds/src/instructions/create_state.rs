use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

use crate::structs::State;

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct CreateState<'info> {
    #[account(init, seeds = [b"statev1".as_ref()], payer = admin, bump)]
    pub state: AccountLoader<'info, State>,
    pub admin: Signer<'info>,
    #[account(seeds = [b"Bonds".as_ref()], bump = nonce)]
    pub program_authority: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<CreateState>, nonce: u8) -> ProgramResult {
    let mut state = ctx.accounts.state.load_init()?;

    *state = State {
        admin: ctx.accounts.admin.key(),
        authority: ctx.accounts.program_authority.key(),
        next_bond_sale: 0,
        bump: *ctx.bumps.get("state").unwrap(),
        nonce,
    };

    Ok(())
}
