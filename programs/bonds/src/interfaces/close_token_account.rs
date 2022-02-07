use anchor_lang::prelude::{AccountInfo, CpiContext};
use anchor_spl::token::CloseAccount;

pub trait CloseTokenAccount<'info> {
    fn close(
        &self,
        account: AccountInfo<'info>,
        destination: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>>;
}
