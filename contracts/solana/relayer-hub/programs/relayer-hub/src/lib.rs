mod errors;
mod states;
mod instructions;
mod utils;

use anchor_lang::prelude::*;
use instructions::{initialize::*, registration::*, transaction_pool::*};

declare_id!("4WPicCsUXGofFXT5HkpXa4tsiSPTeXP8XcxBbWytvEn9");

#[program]
pub mod relayer_hub {
    use super::*;

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
    pub fn init_transaction(ctx: Context<InitTransaction>, sequence: u64, data: Vec<u8>) -> Result<()> {
        instructions::transaction_pool::init_transaction(ctx, sequence, data)
    }

    pub fn execute_transaction(ctx: Context<ExecTransaction>, sequence: u64, success: bool) -> Result<()> {
        instructions::transaction_pool::execute_transaction(ctx, sequence, success)
    }

    pub fn finalize_transaction(ctx: Context<FinalizeTransaction>, sequence: u64, finalize: bool, state_root: [u8;32]) -> Result<()> {
        instructions::transaction_pool::finalize_transaction(ctx, sequence, finalize, state_root)
    }

    pub fn rollup_transaction(ctx: Context<RollupTransaction>, sequence: u64, accept: bool, state_root: [u8;32], vote: u8, epoch: u64) -> Result<()> {
        instructions::transaction_pool::rollup_transaction(ctx, sequence, accept, state_root, vote, epoch)
    }
}
