use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Invalid pool token addresses")]
    InvalidPoolTokenAddresses = 0, // 1770
    #[msg("Buy amount exceeds remaining amount")]
    InsufficientTokenAmount = 1, // 1771
    #[msg("Distribution ended")]
    DistributionEnded = 2, // 1772
}
