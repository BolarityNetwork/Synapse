use anchor_lang::prelude::*;

/// Custom error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Not initialized.")]
    NotInitialized,
    #[msg("Already initialized.")]
    Initialized,
    #[msg("Wrong account.")]
    AccountError,
}
