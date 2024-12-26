use anchor_lang::Accounts;
use anchor_lang::context::Context;
use crate::states::relayer::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RegisterRelayer<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
    mut,
    seeds = [b"relayer".as_ref()],
    bump,
    )]
    pub relayer_info: Box<Account<'info, RelayerInfo>>,

    #[account(
    init,
    seeds = [b"relayer".as_ref(), payer.key().as_ref()],
    bump,
    payer = payer,
    space = 8 + Relayer::INIT_SPACE
    )]
    pub relayer: Box<Account<'info, Relayer>>,
    pub system_program: Program<'info, System>,
}

pub fn register(ctx: Context<RegisterRelayer>) -> Result<()> {
    let relayer_info = &mut ctx.accounts.relayer_info;
    relayer_info.number = relayer_info.number + 1;
    let relayer = &mut ctx.accounts.relayer;
    relayer.owner = *ctx.accounts.payer.key;
    Ok(())
}