use anchor_lang::Accounts;
use anchor_lang::context::Context;
use crate::states::transaction::*;
use anchor_lang::prelude::*;
use crate::states::hub::Config;

#[derive(Accounts)]
#[instruction(chain: u16, sequence: u64)]
/// Context used to push transaction to transaction pool.
pub struct PushTransaction<'info> {
    #[account(mut)]
    /// Relayer account.
    pub relayer: Signer<'info>,

    #[account(
    seeds = [Config::SEED_PREFIX],
    bump,
    )]
    /// Program configuration account.
    pub config: Box<Account<'info, Config>>,

    #[account(
    seeds = [
        TransactionPool::SEED_PREFIX,
        &chain.to_le_bytes()[..]
    ],
    bump,
    )]
    /// Transaction pool account.One transaction pool per chain.
    pub pool: Box<Account<'info, TransactionPool>>,

    // TODO:change space
    #[account(
    init,
    seeds = [
        Transaction::SEED_PREFIX,
        &sequence.to_le_bytes()[..]
    ],
    bump,
    payer = relayer,
    space = 8 + 8 + 256
    )]
    /// Transaction account.
    pub transaction: Box<Account<'info, Transaction>>,

    /// System program.
    pub system_program: Program<'info, System>,
}

/// This instruction is used to push transaction to transaction pool of a certain chain.
///
/// # Arguments
///
/// * `ctx` - `Initialize` context
/// * `chain`   - Chain ID
/// * `sequence`   - Trasaction sequence
/// * `data`   - Transaction data pushed to the transaction pool.
pub fn push_transaction(ctx: Context<PushTransaction>, chain: u16, sequence: u64, data:Vec<u8>) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(crate::errors::error::ErrorCode::NotInitialized.into());
    }
    let pool = &mut ctx.accounts.pool;
    let transaction = &mut ctx.accounts.transaction;
    transaction.sequence = pool.total;
    transaction.data = data;

    pool.total = pool.total + 1;
    Ok(())
}