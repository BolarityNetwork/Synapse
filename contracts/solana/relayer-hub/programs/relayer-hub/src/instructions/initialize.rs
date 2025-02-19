use crate::errors::error::ErrorCode;
use crate::states::hub::*;
use anchor_lang::prelude::*;
use crate::states::relayer::RelayerInfo;
use crate::states::transaction::{FinalTransactionPool, TransactionPool};

#[derive(Accounts)]
/// Context used to initialize global configuration.
pub struct Initialize<'info> {
    #[account(
    init,
    seeds = [Config::SEED_PREFIX],
    bump,
    payer = payer,
    space = 8 + Config::INIT_SPACE
    )]
    /// Program configuration account.which saves program data useful for other instructions.
    /// Also saves the payer of the initialize instruction as the program's owner.
    pub config: Box<Account<'info, Config>>,

    #[account(
    init,
    seeds = [RelayerInfo::SEED_PREFIX],
    bump,
    payer = payer,
    space = 8 + RelayerInfo::MAX_SIZE
    )]
    /// Relayer configuration account.Used to store data related to relayer configuration.
    pub relayer_info: Box<Account<'info, RelayerInfo>>,

    #[account(mut)]
    /// Owner of program.
    pub payer: Signer<'info>,

    /// System program.
    pub system_program: Program<'info, System>,
}

/// This instruction initializes the program config.
/// It also initializes the relayer configuration.
///
/// # Arguments
///
/// * `ctx` - `Initialize` context
/// * `authority` - Upload state root authorizer.
pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // Initialize only once.
    if config_state.initialized {
        return Err(ErrorCode::Initialized.into());
    }
    config_state.initialized = true;
    config_state.authority = authority;
    // Record the owner of the program.
    config_state.owner = ctx.accounts.payer.key();

    let relayer_info = &mut ctx.accounts.relayer_info;
    // Record the number of relayers.
    relayer_info.number = 0;

    Ok(())
}


#[derive(Accounts)]
/// Context used to update config.
pub struct UpdateConfig<'info> {
    #[account(mut)]
    /// Only owner.
    pub owner: Signer<'info>,

    #[account(
    mut,
    has_one = owner @ ErrorCode::OwnerOnly,
    seeds = [Config::SEED_PREFIX],
    bump,
    )]
    /// Program configuration account.
    pub config: Box<Account<'info, Config>>,
    /// System program.
    pub system_program: Program<'info, System>,
}

/// This instruction is used to update config.
///
/// # Arguments
///
/// * `ctx` - `UpdateConfig` context
/// * `authority`   - authority
pub fn update_config(ctx: Context<UpdateConfig>, authority:Pubkey) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(ErrorCode::NotInitialized.into());
    }

    config_state.authority = authority;

    Ok(())
}