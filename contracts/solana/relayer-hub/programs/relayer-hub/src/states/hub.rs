use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub initialized: bool,
    pub bump: u8,
}
