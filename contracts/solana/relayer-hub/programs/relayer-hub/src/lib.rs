mod errors;
mod states;
mod instructions;
mod utils;

use anchor_lang::prelude::*;
use instructions::{initialize::*, registration::*, transaction_pool::*};

declare_id!("48Xgerygjftsx9brotJQbkDZtLov9Gyuj4G3Y7eMirJL");

#[program]
pub mod relayer_hub {
    use super::*;

    /// This instruction initializes the program config.
    /// It also initializes the relayer configuration.
    ///
    /// # Arguments
    ///
    /// * `ctx` - `Initialize` context
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::initialize(ctx)
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
    pub fn register_tx_pool(ctx: Context<RegisterTxPool>, chain: u16) -> Result<()> {
        instructions::registration::register_tx_pool(ctx, chain)
    }

    /// This instruction is used to push transaction to transaction pool of a certain chain.
    ///
    /// # Arguments
    ///
    /// * `ctx` - `Initialize` context
    /// * `chain`   - Chain ID
    /// * `sequence`   - Trasaction sequence
    /// * `data`   - Transaction data pushed to the transaction pool.
    pub fn send_transaction(ctx: Context<SendTransaction>, chain: u16, sequence: u64, data:Vec<u8>) -> Result<()> {
        instructions::transaction_pool::send_transaction(ctx, chain, sequence, data)
    }

}
