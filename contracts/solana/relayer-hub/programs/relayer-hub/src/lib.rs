use anchor_lang::prelude::*;

declare_id!("48Xgerygjftsx9brotJQbkDZtLov9Gyuj4G3Y7eMirJL");

#[program]
pub mod relayer_hub {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
