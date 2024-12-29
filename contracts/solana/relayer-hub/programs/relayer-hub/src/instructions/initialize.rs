use crate::errors::error::ErrorCode;
use crate::states::hub::*;
use anchor_lang::prelude::*;
use crate::states::relayer::RelayerInfo;

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
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // Initialize only once.
    if config_state.initialized {
        return Err(ErrorCode::Initialized.into());
    }
    config_state.initialized = true;
    // Record the owner of the program.
    config_state.owner = ctx.accounts.payer.key();
    config_state.tx_pool_number = 0;
    let relayer_info = &mut ctx.accounts.relayer_info;
    // Record the number of relayers.
    relayer_info.number = 0;

    Ok(())
}
