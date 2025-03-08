use anchor_lang::error_code;

#[error_code]
pub enum NftVerificationError {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Invalid Wormhole emitter")]
    InvalidEmitter,

    #[msg("Invalid payload format")]
    InvalidPayload,

    #[msg("NFT contract not in approved list")]
    UnapprovedNftContract,

    #[msg("Proof already recorded")]
    ProofAlreadyRecorded,

    #[msg("Proof not found")]
    ProofNotFound,

    #[msg("Token already claimed")]
    AlreadyClaimed,

    #[msg("Invalid receiver")]
    InvalidReceiver,

    #[msg("Invalid token account")]
    InvalidTokenAccount,

    #[msg("Invalid vault owner")]
    InvalidVaultOwner,

    #[msg("Insufficient funds in vault")]
    InsufficientFunds,

    #[msg("Invalid admin address")]
    InvalidAdminAddress,

    #[msg("Bump seed not found")]
    BumpNotFound,

    #[msg("Invalid Wormhole consistency level")]
    InvalidConsistencyLevel,
}