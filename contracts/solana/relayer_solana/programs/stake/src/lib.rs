use anchor_lang::prelude::*;

declare_id!("29fp9FCyJjrT91TDyx5VPGTMinXqrRAbAbd634U7ZiXw");

#[program]
pub mod stake {
    use super::*;
    use anchor_lang::system_program;
    use wormhole_anchor_sdk::wormhole;
    use wormhole_anchor_sdk::wormhole::program::Wormhole;
    use core::mem::size_of;
    use anchor_spl::token::accessor::amount;
    use solana_program::system_instruction;
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
        space=size_of::<Escrow>() + 8,
        seeds = [],
        bump)]
        pub escrow: Account<'info, Escrow>,

        /// Rent sysvar.
        pub rent: Sysvar<'info, Rent>,

        /// System program.
        pub system_program: Program<'info, System>,
    }

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Deposit<'info> {
        #[account(mut)]
        /// Whoever initializes the config will be the owner of the program. Signer
        /// for creating the [`Config`] account and posting a Wormhole message
        /// indicating that the program is alive.
        pub payer: Signer<'info>,
        #[account(mut, seeds = [], bump)]
        pub escrow: Account<'info, Escrow>,
        pub system_program: Program<'info, System>,
    }

    pub fn deposit(ctx: Context<Deposit>, amount:u64) -> Result<()> {
        msg!("================{:?}", amount);
        msg!("================{:?}", ctx.accounts.payer.to_account_info());
        msg!("================{:?}", ctx.accounts.payer.data_len());
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &ctx.accounts.escrow.key(),
            amount,
        );
        solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
            ],
        )?;
        // let from_pubkey = ctx.accounts.payer.to_account_info();
        // let to_pubkey = ctx.accounts.escrow.to_account_info();
        // // // from_pubkey.sub_lamports(amount)?;
        // // // to_pubkey.add_lamports(amount)?;
        // **from_pubkey.try_borrow_mut_lamports()? -= amount;
        // **to_pubkey.try_borrow_mut_lamports()? += amount;
        ctx.accounts.escrow.balance = ctx.accounts.escrow.balance + amount;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Withdraw<'info> {
        #[account(mut)]
        /// Whoever initializes the config will be the owner of the program. Signer
        /// for creating the [`Config`] account and posting a Wormhole message
        /// indicating that the program is alive.
        pub payer: Signer<'info>,
        #[account(mut, seeds = [], bump)]
        pub escrow: Account<'info, Escrow>,
        pub system_program: Program<'info, System>,
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount:u64) -> Result<()> {
        let to_pubkey = ctx.accounts.payer.to_account_info();
        let from_pubkey = ctx.accounts.escrow.to_account_info();
        **from_pubkey.try_borrow_mut_lamports()? -= amount;
        **to_pubkey.try_borrow_mut_lamports()? += amount;
        ctx.accounts.escrow.balance = ctx.accounts.escrow.balance - amount;
        Ok(())
    }


    #[account]
    #[derive(InitSpace)]
    pub struct Escrow {
        pub balance: u64,
    }
}
