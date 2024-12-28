use anchor_lang::prelude::*;

#[account]
/// Transaction account.
pub struct Transaction {
    /// The sequence number of the transaction.
    pub sequence: u64,
    /// Transaction data.
    pub data:Vec<u8>,
}

impl Transaction {
    pub const SEED_PREFIX: &'static [u8; 2] = b"tx";
}

#[account]
#[derive(InitSpace)]
/// Transaction pool account.
pub struct TransactionPool {
    /// The total number of transactions.
    pub total: u64,
    /// Chain ID.Refer to wormhole:https://wormhole.com/docs/build/reference/chain-ids/
    pub chain: u16,
}

impl TransactionPool {
    pub const SEED_PREFIX: &'static [u8; 4] = b"pool";
}