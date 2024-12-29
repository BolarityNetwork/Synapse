use anchor_lang::prelude::*;

#[account]
/// Transaction account.
pub struct Transaction {
    /// Index of transaction pool.
    pub pool_index:u16,
    /// The sequence number of the transaction.
    pub sequence: u64,
    /// The sender of the transaction.
    pub sender:Pubkey,
    /// Transaction data.
    pub data:Vec<u8>,
}

impl Transaction {
    pub const SEED_PREFIX: &'static [u8; 2] = b"tx";
    // TODO:change space
    pub const MAX_SIZE: usize = 2 + 8 + 32 + 256;
}

#[account]
#[derive(InitSpace)]
/// Transaction pool account.
pub struct TransactionPool {
    /// Index of transaction pool.
    pub index:u16,
    /// The total number of transactions.
    pub total: u64,
    /// Chain ID.Refer to wormhole:https://wormhole.com/docs/build/reference/chain-ids/
    pub chain: u16,
}

impl TransactionPool {
    pub const SEED_PREFIX: &'static [u8; 4] = b"pool";
}