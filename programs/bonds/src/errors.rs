use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Invalid pool token addresses")]
    InvalidPoolTokenAddresses = 0, // 12c
    #[msg("Buy amount exceeds remaining amount")]
    InsufficientTokenAmount = 1, //12d
}
