use anchor_lang::prelude::*;

#[account]
pub struct Transaction {
    pub sequence: u64,
    pub payload:Vec<u8>,
}

#[account]
#[derive(InitSpace)]
pub struct TransactionPool {
    pub total: u64,
}
