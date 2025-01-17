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

    /// Initializes the weight table for a given epoch
    #[account(0, name = "vault_registry")]
    #[account(1, name = "ncn")]
    #[account(2, writable, name = "weight_table")]
    #[account(3, writable, signer, name = "payer")]
    #[account(4, name = "restaking_program")]
    #[account(5, name = "system_program")]
    InitializeWeightTable{
        epoch: u64,
    },

    /// Resizes the weight table account
    #[account(0, name = "config")]
    #[account(1, writable, name = "weight_table")]
    #[account(2, name = "ncn")]
    #[account(3, name = "vault_registry")]
    #[account(4, writable, signer, name = "payer")]
    #[account(5, name = "system_program")]
    ReallocWeightTable {
        epoch: u64,
    },

    /// Sets a weight
    #[account(0, name = "ncn")]
    #[account(1, writable, name = "weight_table")]
    #[account(2, signer, name = "weight_table_admin")]
    #[account(3, name = "restaking_program")]
    AdminSetWeight{
        st_mint: Pubkey,
        weight: u128,
        epoch: u64,
    },
    /// Initializes the Epoch Snapshot
    #[account(0, name = "config")]
    #[account(1, name = "ncn")]
    #[account(2, name = "weight_table")]
    #[account(3, writable, name = "epoch_snapshot")]
    #[account(4, writable, signer, name = "payer")]
    #[account(5, name = "restaking_program")]
    #[account(6, name = "system_program")]
    InitializeEpochSnapshot{
        epoch: u64,
    },

    /// Initializes the Operator Snapshot
    #[account(0, name = "config")]
    #[account(1, name = "ncn")]
    #[account(2, name = "operator")]
    #[account(3, name = "ncn_operator_state")]
    #[account(4, writable, name = "epoch_snapshot")]
    #[account(5, writable, name = "operator_snapshot")]
    #[account(6, writable, signer, name = "payer")]
    #[account(7, name = "restaking_program")]
    #[account(8, name = "system_program")]
    InitializeOperatorSnapshot{
        epoch: u64,
    },

    /// Resizes the operator snapshot account
    #[account(0, name = "ncn_config")]
    #[account(1, name = "restaking_config")]
    #[account(2, name = "ncn")]
    #[account(3, name = "operator")]
    #[account(4, name = "ncn_operator_state")]
    #[account(5, writable, name = "epoch_snapshot")]
    #[account(6, writable, name = "operator_snapshot")]
    #[account(7, writable, signer, name = "payer")]
    #[account(8, name = "restaking_program")]
    #[account(9, name = "system_program")]
    ReallocOperatorSnapshot {
        epoch: u64,
    },

    /// Snapshots the vault operator delegation
    #[account(0, name = "config")]
    #[account(1, name = "restaking_config")]
    #[account(2, name = "ncn")]
    #[account(3, name = "operator")]
    #[account(4, name = "vault")]
    #[account(5, name = "vault_ncn_ticket")]
    #[account(6, name = "ncn_vault_ticket")]
    #[account(7, name = "vault_operator_delegation")]
    #[account(8, name = "weight_table")]
    #[account(9, writable, name = "epoch_snapshot")]
    #[account(10, writable, name = "operator_snapshot")]
    #[account(11, name = "vault_program")]
    #[account(12, name = "restaking_program")]
    SnapshotVaultOperatorDelegation{
        epoch: u64,
    },
}