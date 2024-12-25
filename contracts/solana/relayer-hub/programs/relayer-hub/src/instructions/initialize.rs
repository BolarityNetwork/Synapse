use crate::errors::error::ErrorCode;
use crate::states::hub::*;
use anchor_lang::prelude::*;
use crate::states::relayer::RelayerInfo;
use crate::states::transaction::TransactionPool;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
    init,
    seeds = [b"config".as_ref()],
    bump,
    payer = payer,
    space = 8 + Config::INIT_SPACE
    )]
    pub config: Box<Account<'info, Config>>,
    #[account(
    init,
    seeds = [b"pool".as_ref()],
    bump,
    payer = payer,
    space = 8 + TransactionPool::INIT_SPACE
    )]
    pub pool: Box<Account<'info, TransactionPool>>,
    #[account(
    init,
    seeds = [b"relayer".as_ref()],
    bump,
    payer = payer,
    space = 8 + Config::INIT_SPACE
    )]
    pub relayer_info: Box<Account<'info, RelayerInfo>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    if config_state.initialized {
        return Err(ErrorCode::Initialized.into());
    }
    config_state.initialized = true;
    let relayer_info = &mut ctx.accounts.relayer_info;
    relayer_info.number = 0;
    let pool = &mut ctx.accounts.pool;
    pool.total = 0;
    Ok(())
}
