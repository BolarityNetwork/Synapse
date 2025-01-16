use borsh::{BorshDeserialize, BorshSerialize};
use shank::ShankInstruction;
use solana_program::pubkey::Pubkey;

#[rustfmt::skip]
#[derive(Debug, BorshSerialize, BorshDeserialize, ShankInstruction)]
pub enum RelayerNcnInstruction {

    // ---------------------------------------------------- //
    //                         GLOBAL                       //
    // ---------------------------------------------------- //
    /// Initialize the config
    #[account(0, writable, name = "config")]
    #[account(1, name = "ncn")]
    #[account(2, signer, name = "ncn_admin")]
    #[account(3, name = "restaking_program")]
    #[account(4, name = "system_program")]
    InitializeConfig {
        epochs_before_stall: u64,
        valid_slots_after_consensus: u64,
    },
    /// Initializes the vault registry
    #[account(0, name = "config")]
    #[account(1, writable, name = "vault_registry")]
    #[account(2, name = "ncn")]
    #[account(3, writable, signer, name = "payer")]
    #[account(4, name = "system_program")]
    InitializeVaultRegistry,

    /// Resizes the vault registry account
    #[account(0, name = "config")]
    #[account(1, writable, name = "vault_registry")]
    #[account(2, name = "ncn")]
    #[account(3, writable, signer, name = "payer")]
    #[account(4, name = "system_program")]
    ReallocVaultRegistry,
    /// Registers a new ST mint in the Vault Registry
    #[account(0, name = "config")]
    #[account(1, name = "ncn")]
    #[account(2, name = "st_mint")]
    #[account(3, writable, name = "vault_registry")]
    #[account(4, signer, writable, name = "admin")]
    #[account(5, name = "restaking_program")]
    AdminRegisterStMint{
        // ncn_fee_group: u8,
        reward_multiplier_bps: u64,
        // switchboard_feed: Option<Pubkey>,
        no_feed_weight: Option<u128>,
    },
    /// Registers a vault to the vault registry
    #[account(0, name = "restaking_config")]
    #[account(1, writable, name = "vault_registry")]
    #[account(2, name = "ncn")]
    #[account(3, name = "vault")]
    #[account(4, name = "vault_ncn_ticket")]
    #[account(5, name = "ncn_vault_ticket")]
    #[account(6, name = "restaking_program_id")]
    #[account(7, name = "vault_program_id")]
    RegisterVault,
}