use anchor_lang::prelude::*;

use crate::structs::State;

#[derive(Accounts)]
pub struct CreateState<'info> {
    #[account(init, seeds = [b"statev1".as_ref()], payer = admin, bump)]
    pub state: AccountLoader<'info, State>,
    pub admin: Signer<'info>,
    pub program_authority: AccountInfo<'info>, //add authority validation
    pub system_program: AccountInfo<'info>,    //add program validation
}

pub fn handler(ctx: Context<CreateState>, bump: u8, nonce: u8) -> ProgramResult {
    // in this anchor version you can load bump from ctx like this *ctx.bumps.get("state").unwrap()
    let mut state = ctx.accounts.state.load_init()?;

    *state = State {
        admin: ctx.accounts.admin.key(),
        authority: ctx.accounts.program_authority.key(),
        next_bond_sale: 0,
        bump,
        nonce,
    };

    Ok(())
}
