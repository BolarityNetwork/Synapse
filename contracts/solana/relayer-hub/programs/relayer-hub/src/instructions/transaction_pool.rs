use anchor_lang::Accounts;
use anchor_lang::context::Context;
use crate::states::transaction::*;
use anchor_lang::prelude::*;
use crate::states::hub::Config;
use crate::states::relayer::RelayerInfo;
use crate::errors::error::ErrorCode;
use crate::utils::message::*;

#[derive(Accounts)]
#[instruction(chain: u16, sequence: u64)]
/// Context used to push transaction to transaction pool.
pub struct SendTransaction<'info> {
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
    seeds = [RelayerInfo::SEED_PREFIX],
    bump,
    )]
    /// Relayer configuration account.
    pub relayer_info: Box<Account<'info, RelayerInfo>>,

    #[account(
    seeds = [
        TransactionPool::SEED_PREFIX,
        &chain.to_le_bytes()[..]
    ],
    bump,
    )]
    /// Transaction pool account.One transaction pool per chain.
    pub pool: Box<Account<'info, TransactionPool>>,

    // #[account(
    // init,
    // seeds = [
    //     Transaction::SEED_PREFIX,
    //     &sequence.to_le_bytes()[..]
    // ],
    // bump,
    // payer = relayer,
    // space = 8 + Transaction::MAX_SIZE
    // )]
    // /// Transaction account.
    // pub transaction: Box<Account<'info, Transaction>>,

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
pub fn send_transaction(ctx: Context<SendTransaction>, _chain: u16, _sequence: u64) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(ErrorCode::NotInitialized.into());
    }
    // Check if it is in its own epoch.
    // Get the Clock sysvar
    // let clock = Clock::get()?;
    // let relayer_info = &ctx.accounts.relayer_info;
    //
    // let relayer_count = relayer_info.relayer_list.len() as u64;
    // let relayer_index:usize = (clock.epoch % relayer_count) as usize;
    //
    // require!(relayer_info.relayer_list[relayer_index] == *ctx.accounts.relayer.key ,
    //     ErrorCode::NotYourEpoch);

    // let message_format = get_msg_format(&data);
    // require!( message_format != MessageFormat::UNDEFINED,
    //     ErrorCode::UndefinedMessageFormat);
    //
    // let pass_check = match message_format {
    //     MessageFormat::WORMHOLE=>{
    //         check_wormhole_message(&data)
    //     },
    //     _ => false,
    // };
    //
    // require!( pass_check,
    //     ErrorCode::MessageFormatError);


    let pool = &mut ctx.accounts.pool;
    // let transaction = &mut ctx.accounts.transaction;
    // transaction.pool_index = pool.index;
    // transaction.sequence = pool.total;
    // transaction.data = data;

    pool.total = pool.total + 1;


    Ok(())
}