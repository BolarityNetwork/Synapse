use anchor_lang::prelude::*;
use solana_program::hash;
use anchor_lang::system_program::Transfer;

declare_id!("E8MhaNDD1nPQzCRCu1KPjuofFcbkjzY6tzvWwLjQxLw5");

#[program]
pub mod proxy {
    use super::*;
    use anchor_lang::system_program;
    use solana_program::instruction::Instruction;
    use solana_program::program::{invoke, invoke_signed};
    use solana_program::system_instruction::SystemInstruction;
    use wormhole_anchor_sdk::wormhole;
    use wormhole_anchor_sdk::wormhole::program::Wormhole;

    #[derive(Accounts)]
    /// Context used to initialize program data (i.e. config).
    pub struct Initialize<'info> {
        #[account(mut)]
        /// Whoever initializes the config will be the owner of the program. Signer
        /// for creating the [`Config`] account and posting a Wormhole message
        /// indicating that the program is alive.
        pub signer: Signer<'info>,

        /// Rent sysvar.
        pub rent: Sysvar<'info, Rent>,

        /// System program.
        pub system_program: Program<'info, System>,
    }

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    // #[derive(Accounts)]
    // /// Context used to proxy call.
    // pub struct ProxyCall<'info> {
    //     #[account(mut)]
    //     pub signer: Signer<'info>,
    //     /// CHECK: This is not dangerous because we don't read or write from this account
    //     pub program_account: AccountInfo<'info>,
    //     /// CHECK:` doc comment explaining why no checks through types are necessary.
    //     #[account(mut)]
    //     pub account1: AccountInfo<'info>,
    //     /// CHECK:` doc comment explaining why no checks through types are necessary.
    //     #[account(mut)]
    //     pub account2: AccountInfo<'info>,
    //     /// CHECK:` doc comment explaining why no checks through types are necessary.
    //     #[account(mut)]
    //     pub account3: AccountInfo<'info>,
    // }
    #[derive(Accounts)]
    pub struct SplitSol<'info> {
        #[account(mut)]
        pub signer: Signer<'info>,
        /// CHECK: This is not dangerous because we don't read or write from this account
        pub program_account: AccountInfo<'info>,
    }
    pub fn proxy_call<'a, 'b, 'c, 'info>(ctx:Context<'a, 'b, 'c, 'info, SplitSol<'info>>, data:Vec<u8>, meta:Vec<u8>, acc_count:u8) -> Result<()> {
        let account_list = helper::AccountList::deserialize(&mut &*meta)?;
        let mut accounts:Vec<AccountMeta>=vec![];
        let mut acc_infos = vec![];
        let mut i  = 0;
        for account in ctx.remaining_accounts {
            let is_signer = account_list.item[i].is_signer;
            let writeable = account_list.item[i].writeable;
            if writeable {
                accounts.push(AccountMeta::new(account.key(), is_signer));
            } else {
                accounts.push(AccountMeta::new_readonly(account.key(), is_signer));
            }
            acc_infos.push(account.to_account_info());
            i+=1;
            if i == acc_count as usize{
                break
            }
        }
        let instruction: Instruction = Instruction {
            program_id: ctx.accounts.program_account.key(),
            accounts,
            data,
        };
        invoke(&instruction, &acc_infos)?;

        Ok(())
    }

    #[derive(Accounts)]
    pub struct Test<'info> {
        #[account(mut)]
        pub signer: Signer<'info>,
        #[account(
        mut,
        seeds = [b"pda", signer2.key().as_ref()],
        bump,
        )]
        pda_account: SystemAccount<'info>,
        #[account(mut)]
        /// CHECK: This is not dangerous because we don't read or write from this account
        pub signer2: AccountInfo<'info>,
        /// CHECK: This is not dangerous because we don't read or write from this account
        pub program_account: AccountInfo<'info>,
    }

    pub fn test(ctx: Context<Test>, data:Vec<u8>) -> Result<()> {

        let to_pubkey = ctx.accounts.signer2.to_account_info();

        let seed = to_pubkey.key();
        let bump_seed = ctx.bumps.pda_account;
        let signer_seeds: &[&[&[u8]]] = &[&[b"pda", seed.as_ref(), &[bump_seed]]];
        msg!("{:?}", [b"pda", seed.as_ref(), &[bump_seed]]);
        let accounts = vec![
            AccountMeta::new(ctx.accounts.pda_account.key(), true), // an immutable non-signer account
        ];
        let instruction: Instruction = Instruction {
            program_id: ctx.accounts.program_account.key(),
            accounts,
            data,
        };
        let acc_infos = vec![
            ctx.accounts.pda_account.to_account_info(),
        ];
        invoke_signed(&instruction, &acc_infos, signer_seeds)?;
        Ok(())
    }


    #[derive(Accounts)]
    pub struct ReceiveMessage<'info> {
        #[account(mut)]
        pub signer: Signer<'info>,
        /// CHECK: This is not dangerous because we don't read or write from this account
        pub program_account: AccountInfo<'info>,
    }
    pub fn receive_message<'a, 'b, 'c, 'info>(ctx:Context<'a, 'b, 'c, 'info, ReceiveMessage<'info>>, data:Vec<u8>) -> Result<()> {
        let account_list = helper::RawData::deserialize(&mut &*data)?;
        msg!("{:?}", account_list);
        let mut accounts:Vec<AccountMeta>=vec![];
        let mut acc_infos = vec![];
        let mut i  = 0;
        for account in ctx.remaining_accounts {
            let is_signer = account_list.accounts[i].is_signer;
            let writeable = account_list.accounts[i].writeable;
            if writeable {
                accounts.push(AccountMeta::new(account.key(), is_signer));
            } else {
                accounts.push(AccountMeta::new_readonly(account.key(), is_signer));
            }
            acc_infos.push(account.to_account_info());
            i+=1;
            if i == account_list.acc_count as usize{
                break
            }
        }
        let instruction: Instruction = Instruction {
            program_id: ctx.accounts.program_account.key(),
            accounts,
            data:account_list.paras,
        };
        invoke(&instruction, &acc_infos)?;

        Ok(())
    }
}

mod helper {
    use super::*;

    #[derive(AnchorSerialize, AnchorDeserialize)]
    pub struct AccountMetaItem {
        pub writeable:bool,
        pub is_signer:bool,
    }

    #[derive(AnchorSerialize, AnchorDeserialize)]
    pub struct AccountList {
        pub item: Vec<AccountMetaItem>,
    }


    #[derive(AnchorSerialize, AnchorDeserialize, Debug)]
    pub struct AccountMetaType {
        pub key: Pubkey,
        pub writeable: bool,
        pub is_signer: bool,
    }

    #[derive(AnchorSerialize, AnchorDeserialize, Debug)]
    pub struct RawData {
        pub chain_id: u16,
        pub caller: Pubkey,
        pub programId: Pubkey,
        pub acc_count: u8,
        pub accounts: Vec<AccountMetaType>,
        pub paras: Vec<u8>,
        pub acc_meta: Vec<u8>,
    }

    // pub fn get_function_hash(namespace: &str, name: &str) -> [u8; 8] {
    //     let preimage = format!("{}:{}", namespace, name);
    //     let mut sighash = [0u8; 8];
    //     sighash.copy_from_slice(&hash::hash(preimage.as_bytes()).to_bytes()[..8]);
    //     sighash
    // }
    //
    // #[derive(AnchorSerialize, AnchorDeserialize)]
    // struct SomeProgramCpiArgs {
    //     some_arg: u8,
    //     some_arg1: u8,
    // }
    //
    // pub fn some_program_ix_data(
    //     some_arg: u8,
    //     some_arg1: u8
    // ) -> Vec<u8> {
    //     let hash = get_function_hash("global", "set");
    //     let mut buf: Vec<u8> = vec![];
    //     buf.extend_from_slice(&hash);
    //     let args = SomeProgramCpiArgs {
    //         some_arg,
    //         some_arg1,
    //     };
    //     args.serialize(&mut buf).unwrap();
    //     msg!("{:?}", buf);
    //     buf
    // }
}