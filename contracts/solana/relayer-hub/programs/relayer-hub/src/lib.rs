mod errors;
mod states;
mod instructions;
mod utils;

use anchor_lang::prelude::*;
use instructions::{initialize::*, registration::*, transaction_pool::*};

declare_id!("48Xgerygjftsx9brotJQbkDZtLov9Gyuj4G3Y7eMirJL");

#[program]
pub mod relayer_hub {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::initialize(ctx)
    }

    pub fn register(ctx: Context<RegisterRelayer>) -> Result<()> {
        instructions::registration::register(ctx)
    }

    pub fn push_transaction(ctx: Context<PushTransaction>, data:Vec<u8>) -> Result<()> {
        instructions::transaction_pool::push_transaction(ctx, data)
    }

}
