use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Status{
    Failing = 254,
    Failed = 255,
    Pending  = 1,
    Executed = 2,
    Finality = 3,
}

#[account]
/// Transaction account.
pub struct Transaction {
    // /// Index of transaction pool.
    // pub pool_index:u16,
    /// The sequence number of the transaction pool.
    pub sequence: u64,
    // pub timestamp: u32,
    // pub from_chain: u16,
    // pub to_chain: u16,
    /// The sender of the transaction.
    pub relayer: Pubkey,
    /// Root of transaction's state.
    pub state_root: [u8;32],
    /// Epoch for which this account was created.
    pub epoch: u64,
    /// 254 failing 255 failed 1 pending 2 executed 3 finality
    pub status: Status,
    // pub hash: [u8;64],
    // /// Transaction data.
    // pub data:Vec<u8>,
}

impl Transaction {
    pub const SEED_PREFIX: &'static [u8; 2] = b"tx";
    // TODO:change space
    pub const MAX_SIZE: usize = 8  + 32 + 32 + 8 + 1;
}

#[account]
#[derive(InitSpace)]
/// Transaction pool account.
pub struct TransactionPool {
    // /// Index of transaction pool.
    // pub index:u16,
    /// The total number of transactions.
    pub total: u64,
    // /// Chain ID.Refer to wormhole:https://wormhole.com/docs/build/reference/chain-ids/
    // pub chain: u16,
}

impl TransactionPool {
    pub const SEED_PREFIX: &'static [u8; 4] = b"pool";
}


#[account]
#[derive(InitSpace)]
/// Transaction account.
pub struct FinalTransaction {
    /// The sequence number of the transaction.
    pub sequence: u64,
    /// Root of transaction's state.
    pub state_root: [u8;32],
    /// Epoch for which this account was created.
    pub epoch: u64,
    pub accepted: bool,
    pub votes: u8,
}

impl FinalTransaction {
    pub const SEED_PREFIX: &'static [u8; 8] = b"final_tx";
    // pub const MAX_SIZE: usize = 8 + 32 + 8 + 1 + 1;
}

#[account]
#[derive(InitSpace)]
/// Transaction pool account.
pub struct FinalTransactionPool {
    /// The total number of transactions.
    pub total: u64,
}

impl FinalTransactionPool {
    pub const SEED_PREFIX: &'static [u8; 10] = b"final_pool";
}

#[account]
#[derive(InitSpace)]
pub struct EpochSequence {
    pub epoch: u64,
    pub begin_sequence: u64,
    pub current_sequence: u64,
}

impl EpochSequence {
    pub const SEED_PREFIX: &'static [u8; 14] = b"epoch_sequence";
}

#[account]
#[derive(InitSpace)]
/// Un executed transaction pool account.
pub struct UnExecutedTransactionPool {
    /// Emitter chain.
    pub chain: u16,
    /// Emitter address. Cannot be zero address.
    pub address: [u8; 32],
    /// The sequence of messages processed so far.
    pub current: u64,
}

impl UnExecutedTransactionPool {
    pub const SEED_PREFIX: &'static [u8; 11] = b"un_executed";
}