use borsh::{BorshDeserialize, BorshSerialize};
use shank::ShankInstruction;

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
}