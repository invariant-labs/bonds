use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Invalid pool token addresses")]
    InvalidPoolTokenAddresses = 0, // 1770
    #[msg("Buy amount exceeds remaining amount")]
    InsufficientTokenAmount = 1, // 1771
    #[msg("Vesting ended")]
    VestingEnded = 2, // 1772
    #[msg("Actual price exceeded price limit")]
    PriceLimitExceeded = 3, // 1773
}
