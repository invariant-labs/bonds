use anchor_lang::prelude::*;

use crate::structs::State;

#[derive(Accounts)]
pub struct CreateState<'info> {
    #[account(init, seeds = [b"statev1"], payer = admin, bump)]
    pub state: AccountLoader<'info, State>,
    pub admin: Signer<'info>,
    pub program_authority: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
}

pub fn handler(ctx: Context<CreateState>, bump: u8, nonce: u8) -> ProgramResult {
    let mut state = ctx.accounts.state.load_init()?;

    *state = State {
        admin: ctx.accounts.admin.key(),
        authority: ctx.accounts.program_authority.key(),
        bump,
        nonce,
    };

    Ok(())
}
