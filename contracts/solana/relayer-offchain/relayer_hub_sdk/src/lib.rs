#![allow(clippy::redundant_pub_crate)]
use anchor_lang::{declare_program};
use anchor_lang::prelude::Pubkey;
use anchor_lang::solana_program::clock::Epoch;

declare_program!(relayer_hub);

pub mod instruction;

pub const CONFIG_SEED: &[u8] = b"config";
pub const RELAYER_SEED: &[u8] = b"relayer";
pub const POOL_SEED: &[u8] = b"pool";
pub const TRANSACTION_SEED: &[u8] = b"tx";
pub fn derive_config_account_address(relayer_hub_program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[CONFIG_SEED], relayer_hub_program_id)
}

pub fn derive_relayer_info_account_address(relayer_hub_program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[RELAYER_SEED], relayer_hub_program_id)
}

pub fn derive_relayer_account_address(
    relayer_hub_program_id: &Pubkey,
    relayer_pubkey: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            RELAYER_SEED,
            relayer_pubkey.to_bytes().as_ref(),
        ],
        relayer_hub_program_id,
    )
}

pub fn derive_pool_account_address(
    relayer_hub_program_id: &Pubkey,
    chain: u16,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            POOL_SEED,
            &chain.to_le_bytes()[..],
        ],
        relayer_hub_program_id,
    )
}

pub fn derive_transaction_account_address(
    relayer_hub_program_id: &Pubkey,
    chain: u16,
    sequence: u64,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            TRANSACTION_SEED,
            &sequence.to_le_bytes()[..],
        ],
        relayer_hub_program_id,
    )
}