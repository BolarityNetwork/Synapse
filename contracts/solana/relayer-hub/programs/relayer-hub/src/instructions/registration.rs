use anchor_lang::Accounts;
use anchor_lang::context::Context;
use crate::states::relayer::*;
use anchor_lang::prelude::*;
use crate::states::hub::Config;
use crate::errors::error::ErrorCode;
use crate::states::transaction::TransactionPool;

#[derive(Accounts)]
/// Context used to register relayer.
pub struct RegisterRelayer<'info> {
    #[account(mut)]
    /// Owner of relayer.
    pub payer: Signer<'info>,
    #[account(
    seeds = [Config::SEED_PREFIX],
    bump,
    )]
    /// Program configuration account.
    pub config: Box<Account<'info, Config>>,
    #[account(
    mut,
    seeds = [RelayerInfo::SEED_PREFIX],
    bump,
    )]
    /// Relayer configuration account.
    pub relayer_info: Box<Account<'info, RelayerInfo>>,

    #[account(
    init,
    seeds = [Relayer::SEED_PREFIX, payer.key().as_ref()],
    bump,
    payer = payer,
    space = 8 + Relayer::INIT_SPACE
    )]
    pub relayer: Box<Account<'info, Relayer>>,
    /// System program.
    pub system_program: Program<'info, System>,
}

/// This instruction registers the relayer and must be used after initialization.
///
/// # Arguments
///
/// * `ctx` - `Initialize` context
pub fn register_relayer(ctx: Context<RegisterRelayer>) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(ErrorCode::NotInitialized.into());
    }

    let payer_key = *ctx.accounts.payer.key;

    let relayer_info = &mut ctx.accounts.relayer_info;
    relayer_info.relayer_list.push(payer_key);
    relayer_info.number = relayer_info.number + 1;

    let relayer = &mut ctx.accounts.relayer;
    relayer.owner = payer_key;

    Ok(())
}

#[derive(Accounts)]
#[instruction(chain: u16)]
/// Context used to register transaction pool.
pub struct RegisterTxPool<'info> {
    #[account(mut)]
    /// Only owner.
    pub owner: Signer<'info>,

    #[account(
    has_one = owner @ ErrorCode::OwnerOnly,
    seeds = [Config::SEED_PREFIX],
    bump,
    )]
    /// Program configuration account.
    pub config: Box<Account<'info, Config>>,

    #[account(
    init_if_needed,
    seeds = [
        TransactionPool::SEED_PREFIX,
        &chain.to_le_bytes()[..]
    ],
    bump,
    payer = owner,
    space = 8 + TransactionPool::INIT_SPACE
    )]
    /// Transaction pool account.One transaction pool per chain.
    pub pool: Box<Account<'info, TransactionPool>>,
    /// System program.
    pub system_program: Program<'info, System>,
}

/// This instruction is used to register a transaction pool of a certain chain.
///
/// # Arguments
///
/// * `ctx` - `Initialize` context
/// * `chain`   - Chain ID
pub fn register_tx_pool(ctx: Context<RegisterTxPool>, chain: u16) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(ErrorCode::NotInitialized.into());
    }

    let pool = &mut ctx.accounts.pool;
    pool.index = config_state.tx_pool_number;
    pool.total = 0;
    pool.chain = chain;

    Ok(())
}