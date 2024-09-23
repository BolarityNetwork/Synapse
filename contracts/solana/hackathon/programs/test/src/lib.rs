use anchor_lang::prelude::*;

declare_id!("DViLwexyLUuKRRXWCQgFYqzoVLWktEbvUVhzKNZ7qTSF");

#[program]
pub mod test {
    use super::*;
    use anchor_lang::system_program;
    use wormhole_anchor_sdk::wormhole;
    use wormhole_anchor_sdk::wormhole::program::Wormhole;
    use core::mem::size_of;
    #[derive(Accounts)]
    /// Context used to initialize program data (i.e. config).
    pub struct Initialize<'info> {
        #[account(mut)]
        /// Whoever initializes the config will be the owner of the program. Signer
        /// for creating the [`Config`] account and posting a Wormhole message
        /// indicating that the program is alive.
        pub signer: Signer<'info>,

        #[account(init,
        payer = signer,
        space=size_of::<MyStorage>() + 8,
        seeds = [],
        bump)]
        pub my_storage: Account<'info, MyStorage>,

        /// Rent sysvar.
        pub rent: Sysvar<'info, Rent>,

        /// System program.
        pub system_program: Program<'info, System>,
    }

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Set<'info> {
        #[account(mut, seeds = [], bump)]
        pub my_storage: Account<'info, MyStorage>,
    }

    pub fn set(ctx: Context<Set>, new_x: u8, new_y: u8) -> Result<()> {
        ctx.accounts.my_storage.data = new_x + new_y;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Tet<'info>  {
        #[account(mut)]
        /// Whoever initializes the config will be the owner of the program. Signer
        /// for creating the [`Config`] account and posting a Wormhole message
        /// indicating that the program is alive.
        pub signer: Signer<'info>,
    }

    pub fn tet(ctx: Context<Tet>) -> Result<()> {
        Ok(())
    }
    #[account]
    #[derive(InitSpace)]
    pub struct MyStorage {
        pub data: u8,
    }

}
