use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
/// Global Configuration Account.
pub struct Config {
    /// Program's owner.
    pub owner: Pubkey,
    /// Initialization flag, used to mark whether the global configuration has been initialized.
    pub initialized: bool,
    /// The total number of transaction pools.
    pub tx_pool_number:u16,
}

impl Config {
    pub const SEED_PREFIX: &'static [u8; 6] = b"config";
}