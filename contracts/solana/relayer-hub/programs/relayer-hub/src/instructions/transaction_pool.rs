use anchor_lang::Accounts;
use anchor_lang::context::Context;
use crate::states::transaction::*;
use anchor_lang::prelude::*;
use solana_program::clock::Epoch;
use crate::states::hub::Config;
use crate::states::relayer::RelayerInfo;
use crate::errors::error::ErrorCode;
use crate::utils::message::*;
use crate::states::transaction::Status;

#[derive(Accounts)]
#[instruction(chain: u16, address: [u8; 32], sequence: u64, ext_sequence: u64, epoch: u64)]
/// Context used to push transaction to transaction pool.
pub struct InitExecTransaction<'info> {
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
    mut,
    seeds = [
        TransactionPool::SEED_PREFIX,
    ],
    bump,
    )]
    /// Transaction pool account.One transaction pool per chain.
    pub pool: Box<Account<'info, TransactionPool>>,

    #[account(
    init,
    seeds = [
        Transaction::SEED_PREFIX,
        &chain.to_le_bytes()[..],
        &address[..],
        &sequence.to_le_bytes()[..]
    ],
    bump,
    payer = relayer,
    space = 8 + Transaction::MAX_SIZE
    )]
    /// Transaction account.
    pub transaction: Box<Account<'info, Transaction>>,

    #[account(
    init,
    seeds = [
        ExtendTransaction::SEED_PREFIX,
        &ext_sequence.to_le_bytes()[..]
    ],
    bump,
    payer = relayer,
    space = 8 + ExtendTransaction::MAX_SIZE
    )]
    /// Transaction account.
    pub ext_transaction: Box<Account<'info, ExtendTransaction>>,

    #[account(
    init_if_needed,
    seeds = [
        EpochSequence::SEED_PREFIX,
        &epoch.to_le_bytes()[..]
    ],
    bump,
    payer = relayer,
    space = 8 + EpochSequence::INIT_SPACE
    )]
    /// Transaction account.
    pub epoch_sequence: Box<Account<'info, EpochSequence>>,
    #[account(
    init_if_needed,
    payer = relayer,
    seeds = [
        FinalTransaction::SEED_PREFIX,
        &epoch.to_le_bytes()[..]
    ],
    bump,
    space = 8 + FinalTransaction::INIT_SPACE
    )]
    /// Transaction account.
    pub final_transaction: Box<Account<'info, FinalTransaction>>,
    /// System program.
    pub system_program: Program<'info, System>,
}

pub fn init_execute_transaction(ctx: Context<InitExecTransaction>,
                                chain: u16,
                                address: [u8; 32],
                                sequence: u64,
                                ext_sequence: u64,
                                epoch: Epoch,
                                success: bool,
                                hash: [u8; 64]) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(ErrorCode::NotInitialized.into());
    }
    // Check if it is in its own epoch.
    let relayer_info = &ctx.accounts.relayer_info;

    let relayer_count = relayer_info.relayer_list.len() as u64;
    let relayer_index:usize = (epoch % relayer_count) as usize;

    // require!(relayer_info.relayer_list[relayer_index] == *ctx.accounts.relayer.key ,
    //     ErrorCode::NotYourEpoch);

    // let message_format = get_msg_format(&data);
    // require!( message_format != MessageFormat::UNDEFINED,
    //     ErrorCode::UndefinedMessageFormat);

    let transaction = &mut ctx.accounts.transaction;

    // let pass_check = match message_format {
    //     MessageFormat::WORMHOLE=>{
    //         if let Ok(vaa) = parse_wormhole_message(&data) {
    //             let body = vaa.body();
    //             transaction.from_chain = body.emitter_chain();
    //             transaction.timestamp = body.timestamp();
    //             true
    //         } else{
    //             false
    //         }
    //     },
    //     _ => false,
    // };
    //
    // require!( pass_check,
    //     ErrorCode::MessageFormatError);

    let pool = &mut ctx.accounts.pool;
    msg!("chain:{},address:{:?}, sequence:{}", chain, address, sequence);

    transaction.sequence = pool.total;
    transaction.epoch = epoch;
    transaction.relayer = ctx.accounts.relayer.key.clone();
    // transaction.data = data;
    transaction.hash = hash;

    transaction.status = if success {
        Status::Executed
    } else {
        Status::Failing
    };
    let ext_transaction = &mut ctx.accounts.ext_transaction;
    let ext_sequence = pool.total;
    ext_transaction.sequence = ext_sequence;
    ext_transaction.emitter_chain = chain;
    ext_transaction.emitter_address = address;
    ext_transaction.emitter_sequence = sequence;

    pool.total = pool.total + 1;
    let epoch_sequence = &mut ctx.accounts.epoch_sequence;
    if epoch_sequence.begin_sequence ==0 {
        epoch_sequence.begin_sequence = ext_sequence;
    }
    epoch_sequence.current_sequence = ext_sequence;
    epoch_sequence.epoch = epoch;

    Ok(())
}
#[derive(Accounts)]
#[instruction(chain: u16, address: [u8; 32], sequence: u64)]
/// Context used to push transaction to transaction pool.
pub struct FinalizeTransaction<'info> {
    #[account(mut)]
    /// Operator account.
    pub operator: Signer<'info>,

    #[account(
    seeds = [Config::SEED_PREFIX],
    bump,
    )]
    /// Program configuration account.
    pub config: Box<Account<'info, Config>>,

    #[account(
    mut,
    seeds = [
        Transaction::SEED_PREFIX,
        &chain.to_le_bytes()[..],
        &address[..],
        &sequence.to_le_bytes()[..]
    ],
    bump,
    )]
    /// Transaction account.
    pub transaction: Box<Account<'info, Transaction>>,

    /// System program.
    pub system_program: Program<'info, System>,
}

pub fn finalize_transaction(ctx: Context<FinalizeTransaction>,
                            chain: u16,
                            address: [u8; 32],
                            sequence: u64,
                            finalize: bool,
                            state_root: [u8;32]) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(ErrorCode::NotInitialized.into());
    }
    // Check if it is in its own epoch.

    let transaction = &mut ctx.accounts.transaction;
    let old_status = transaction.status.clone();
    match old_status {
        Status::Executed =>{
            if finalize {
                transaction.status =Status::Finality;
            }
        },
        Status::Failing =>{
            if !finalize {
                transaction.status =Status::Failed;
            }
        },
        _ =>{}
    };
    transaction.state_root = state_root;
    Ok(())
}


#[derive(Accounts)]
#[instruction(epoch: u64)]
/// Context used to push transaction to transaction pool.
pub struct RollupTransaction<'info> {
    #[account(mut)]
    /// ncn config account.
    pub rollup_authority: Signer<'info>,

    #[account(
    seeds = [Config::SEED_PREFIX],
    bump,
    )]
    /// Program configuration account.
    pub config: Box<Account<'info, Config>>,

    #[account(
    mut,
    seeds = [
        FinalTransactionPool::SEED_PREFIX,
    ],
    bump,
    )]
    /// Transaction pool account.One transaction pool per chain.
    pub pool: Box<Account<'info, FinalTransactionPool>>,

    // #[account(
    // mut,
    // seeds = [
    //     FinalTransaction::SEED_PREFIX,
    //     &epoch.to_le_bytes()[..]
    // ],
    // bump,
    // )]
    #[account(mut, rent_exempt = enforce)]
    /// Transaction account.
    pub transaction: Box<Account<'info, FinalTransaction>>,

    /// System program.
    pub system_program: Program<'info, System>,
}

pub fn rollup_transaction(ctx: Context<RollupTransaction>, accept: bool, state_root: [u8;32], vote: u8, epoch: u64) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(ErrorCode::NotInitialized.into());
    }
    let rollup_authority = &mut ctx.accounts.rollup_authority;

    require!(*rollup_authority.key == config_state.authority, ErrorCode::AccountError);

    let pool = &mut ctx.accounts.pool;
    let transaction = &mut ctx.accounts.transaction;
    transaction.state_root = state_root;
    transaction.epoch = epoch;
    transaction.votes = vote;
    transaction.accepted = accept;
    transaction.sequence = pool.total;

    pool.total = pool.total + 1;
    Ok(())
}

#[derive(Accounts)]
#[instruction(chain: u16, chain_address: [u8;32])]
/// Context used to push transaction to transaction pool.
pub struct PushToUnExecuted<'info> {
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
    init_if_needed,
    seeds = [
        UnExecutedTransactionPool::SEED_PREFIX,
        &chain.to_le_bytes()[..],
        &chain_address[..]
    ],
    bump,
    payer = relayer,
    space = 8 + UnExecutedTransactionPool::INIT_SPACE
    )]
    /// Transaction pool account.One transaction pool per chain.
    pub pool: Box<Account<'info, UnExecutedTransactionPool>>,
    /// System program.
    pub system_program: Program<'info, System>,
}

pub fn push_to_un_executed(ctx: Context<PushToUnExecuted>, chain: u16, chain_address: [u8;32], sequence: u64) -> Result<()> {
    let config_state = &mut ctx.accounts.config;
    // To initialize first.
    if !config_state.initialized {
        return Err(ErrorCode::NotInitialized.into());
    }

    // Check if it is in its own epoch.
    let relayer_info = &ctx.accounts.relayer_info;
    let clock = Clock::get()?;
    let epoch = clock.epoch;

    let relayer_count = relayer_info.relayer_list.len() as u64;
    let relayer_index:usize = (epoch % relayer_count) as usize;

    // require!(relayer_info.relayer_list[relayer_index] == *ctx.accounts.relayer.key ,
    //     ErrorCode::NotYourEpoch);
    let pool = &mut ctx.accounts.pool;

    // If it has been processed, it will not be processed again.
    if pool.current >= sequence{
        return Ok(());
    }

    pool.chain = chain;

    if pool.address.iter().all(|&x| x == 0) {
        pool.address = chain_address;
    }

    let current_sequence = pool.current;

    if sequence > current_sequence {
        pool.current = sequence;
    }

    Ok(())
}

