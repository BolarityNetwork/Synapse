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
/// Relayer configuration account.
pub struct RelayerInfo {
    /// The total number of relayers.
    pub number: u16,
    pub relayer_list:Vec<Pubkey>,
}

impl RelayerInfo {
    pub const SEED_PREFIX: &'static [u8; 7] = b"relayer";
    // Up to 100 relayers.
    pub const MAX_SIZE: usize = 2 + 32*100;
}