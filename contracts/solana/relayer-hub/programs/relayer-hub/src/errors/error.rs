use anchor_lang::prelude::*;

/// Custom error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Not initialized.")]
    /// The program has not been initialized.
    NotInitialized,

    #[msg("Already initialized.")]
    /// The program has been initialized
    Initialized,

    #[msg("Wrong account.")]
    /// Incorrect account.
    AccountError,

    #[msg("OwnerOnly")]
    /// Only the program's owner is permitted.
    OwnerOnly,

    #[msg("Not in your epoch")]
    /// Not the epoch executed by the relayer.
    NotYourEpoch,

    #[msg("Undefined message data format")]
    /// Wrong message data format.
    UndefinedMessageFormat,

    #[msg("Wrong message data format")]
    /// Wrong message data format.
    MessageFormatError,

    #[msg("Wrong epoch")]
    /// Wrong epoch.
    EpochError,

    #[msg("Wrong sequence")]
    /// Wrong sequence.
    SequenceError,
}
