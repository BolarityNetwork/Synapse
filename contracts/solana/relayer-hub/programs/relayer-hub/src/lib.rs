mod errors;
mod states;
mod instructions;
use anchor_lang::prelude::*;
use instructions::initialize::*;

declare_id!("48Xgerygjftsx9brotJQbkDZtLov9Gyuj4G3Y7eMirJL");

#[program]
pub mod relayer_hub {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::initialize(ctx)
    }
}
