use anchor_lang::prelude::*;


#[account]
#[derive(InitSpace)]
pub struct Relayer {
    pub owner: Pubkey,
    pub bump: u8,
}


#[account]
#[derive(InitSpace)]
pub struct RelayerInfo {
    pub number: u64,
}
