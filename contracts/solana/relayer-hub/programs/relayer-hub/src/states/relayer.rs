use anchor_lang::prelude::*;


#[account]
#[derive(InitSpace)]
/// Relayer account.
pub struct Relayer {
    /// Relayer's owner.
    pub owner: Pubkey,
}

impl Relayer {
    pub const SEED_PREFIX: &'static [u8; 7] = b"relayer";
}

#[account]
#[derive(InitSpace)]
/// Relayer configuration account.
pub struct RelayerInfo {
    /// The total number of relayers.
    pub number: u64,
}

impl RelayerInfo {
    pub const SEED_PREFIX: &'static [u8; 7] = b"relayer";
}