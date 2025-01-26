mod errors;
mod states;
mod instructions;
mod utils;
use solana_program::stake_history::Epoch;
use anchor_lang::prelude::*;
use instructions::{initialize::*, registration::*, transaction_pool::*};

declare_id!("25dmj8Y96VsSGMz4acYpfXD66vFSDNn8wB5wz1gmNZsH");

#[program]
pub mod relayer_hub {
    use super::*;
    use crate::errors::error::ErrorCode;
    /// This instruction initializes the program config.
    /// It also initializes the relayer configuration.
    ///
    /// # Arguments
    ///
    /// * `ctx` - `Initialize` context
    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        instructions::initialize::initialize(ctx, authority)
    }

    /// This instruction registers the relayer and must be used after initialization.
    ///
    /// # Arguments
    ///
    /// * `ctx` - `Initialize` context
    pub fn register_relayer(ctx: Context<RegisterRelayer>) -> Result<()> {
        instructions::registration::register_relayer(ctx)
    }

    /// This instruction is used to register a transaction pool of a certain chain.
    ///
    /// # Arguments
    ///
    /// * `ctx` - `Initialize` context
    /// * `chain`   - Chain ID
    pub fn register_tx_pool(ctx: Context<RegisterTxPool>) -> Result<()> {
        instructions::registration::register_tx_pool(ctx)
    }

    /// This instruction is used to push transaction to transaction pool of a certain chain.
    ///
    /// # Arguments
    ///
    /// * `ctx` - `Initialize` context
    /// * `chain`   - Chain ID
    /// * `sequence`   - Trasaction sequence
    /// * `data`   - Transaction data pushed to the transaction pool.
    pub fn init_transaction(ctx: Context<InitTransaction>, sequence: u64, epoch: Epoch, data: Vec<u8>) -> Result<()> {
        let clock = Clock::get()?;
        let get_epoch = clock.epoch;

        require!( get_epoch == epoch, ErrorCode::EpochError);

        instructions::transaction_pool::init_transaction(ctx, sequence, epoch, data)
    }

    pub fn execute_transaction(ctx: Context<ExecTransaction>, sequence: u64, success: bool) -> Result<()> {
        instructions::transaction_pool::execute_transaction(ctx, sequence, success)
    }

    pub fn finalize_transaction(ctx: Context<FinalizeTransaction>, sequence: u64, finalize: bool, state_root: [u8;32]) -> Result<()> {
        instructions::transaction_pool::finalize_transaction(ctx, sequence, finalize, state_root)
    }

    pub fn rollup_transaction(ctx: Context<RollupTransaction>, accept: bool, state_root: [u8;32], vote: u8, epoch: u64) -> Result<()> {
        let clock = Clock::get()?;
        let get_epoch = clock.epoch;

        require!( get_epoch == epoch, ErrorCode::EpochError);
        instructions::transaction_pool::rollup_transaction(ctx, accept, state_root, vote, epoch)
    }
}
