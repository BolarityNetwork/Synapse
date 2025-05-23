mod errors;
mod states;
mod instructions;
mod utils;
use solana_program::stake_history::Epoch;
use anchor_lang::prelude::*;
use instructions::{initialize::*, registration::*, transaction_pool::*};

declare_id!("39djqgS6KR6SWb3T39bTj8QMX3iuMMLP41PVjk89ieJh");

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

    pub fn update_config(ctx: Context<UpdateConfig>, authority: Pubkey) -> Result<()> {
        instructions::initialize::update_config(ctx, authority)
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
    pub fn init_execute_transaction(ctx: Context<InitExecTransaction>,
                                    chain: u16,
                                    address: [u8; 32],
                                    sequence: u64,
                                    ext_sequence: u64,
                                    epoch: Epoch,
                                    success: bool,
                                    hash: [u8; 64]) -> Result<()> {
        let clock = Clock::get()?;
        let get_epoch = clock.epoch;

        require!( get_epoch == epoch, ErrorCode::EpochError);

        let pool = &ctx.accounts.pool;
        let exp_sequence = pool.total;

        require!( exp_sequence == ext_sequence, ErrorCode::SequenceError);

        instructions::transaction_pool::init_execute_transaction(ctx, chain, address, sequence, ext_sequence, epoch, success, hash)
    }

    pub fn finalize_transaction(ctx: Context<FinalizeTransaction>,
                                chain: u16,
                                address: [u8; 32],
                                sequence: u64,
                                finalize: bool,
                                state_root: [u8;32]) -> Result<()> {
        instructions::transaction_pool::finalize_transaction(ctx, chain, address, sequence, finalize, state_root)
    }

    pub fn rollup_transaction(ctx: Context<RollupTransaction>, accept: bool, state_root: [u8;32], vote: u8, epoch: u64) -> Result<()> {
        instructions::transaction_pool::rollup_transaction(ctx, accept, state_root, vote, epoch)
    }

    pub fn push_to_un_executed(ctx: Context<PushToUnExecuted>, chain: u16, chain_address: [u8;32], sequence: u64) -> Result<()> {
        instructions::transaction_pool::push_to_un_executed(ctx, chain, chain_address, sequence)
    }
}
