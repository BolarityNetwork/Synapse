use anchor_lang::Accounts;
use anchor_lang::context::Context;
use crate::states::transaction::*;
use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct PushTransaction<'info> {
    #[account(mut)]
    pub relayer: Signer<'info>,
    // TODO:change space
    #[account(
    init,
    seeds = [user.key().as_ref()],
    bump,
    payer = user,
    space = 8 + 8 + 256
    )]
    pub transaction: Box<Account<'info, Transaction>>,
    #[account(
    mut,
    seeds = [b"pool".as_ref()],
    bump,
    )]
    pub pool: Box<Account<'info, TransactionPool>>,
    pub system_program: Program<'info, System>,
}

pub fn push_transaction(ctx: Context<PushTransaction>, data:Vec<u8>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let transaction = &mut ctx.accounts.transaction;
    transaction.sequence = pool.total;
    transaction.payload = data;
    pool.total = pool.total + 1;
    Ok(())
}