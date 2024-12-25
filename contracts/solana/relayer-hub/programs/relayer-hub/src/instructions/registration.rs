use anchor_lang::Accounts;
use anchor_lang::context::Context;
use crate::states::relayer::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RegisterRelayer<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
    mut,
    seeds = [b"relayer".as_ref()],
    bump,
    )]
    pub relayer_info: Box<Account<'info, RelayerInfo>>,

    #[account(
    init,
    seeds = [user.key().as_ref()],
    bump,
    payer = user,
    space = 8 + ConsensusState::INIT_SPACE
    )]
    pub relayer: Box<Account<'info, Relayer>>,
    /// CHECK: The address check is needed because otherwise
    /// the supplied Sysvar could be anything else.
    /// The Instruction Sysvar has not been implemented
    /// in the Anchor framework yet, so this is the safe approach.
    #[account(address = IX_ID)]
    pub ix_sysvar: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn register(ctx: Context<RegisterRelayer>) -> Result<()> {
    let relayer_info = &mut ctx.accounts.relayer_info;
    relayer_info.number = relayer_info.number + 1;
    let relayer = &mut ctx.accounts.relayer;
    relayer.owner = *ctx.accounts.user.key;
    Ok(())
}