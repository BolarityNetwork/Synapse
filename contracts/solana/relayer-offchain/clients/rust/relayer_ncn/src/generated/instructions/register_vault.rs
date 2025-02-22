//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! <https://github.com/kinobi-so/kinobi>

use borsh::{BorshDeserialize, BorshSerialize};

/// Accounts.
pub struct RegisterVault {
    pub restaking_config: solana_program::pubkey::Pubkey,

    pub vault_registry: solana_program::pubkey::Pubkey,

    pub ncn: solana_program::pubkey::Pubkey,

    pub vault: solana_program::pubkey::Pubkey,

    pub vault_ncn_ticket: solana_program::pubkey::Pubkey,

    pub ncn_vault_ticket: solana_program::pubkey::Pubkey,

    pub restaking_program_id: solana_program::pubkey::Pubkey,

    pub vault_program_id: solana_program::pubkey::Pubkey,
}

impl RegisterVault {
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        self.instruction_with_remaining_accounts(&[])
    }
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction_with_remaining_accounts(
        &self,
        remaining_accounts: &[solana_program::instruction::AccountMeta],
    ) -> solana_program::instruction::Instruction {
        let mut accounts = Vec::with_capacity(8 + remaining_accounts.len());
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.restaking_config,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.vault_registry,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.ncn, false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.vault, false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.vault_ncn_ticket,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.ncn_vault_ticket,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.restaking_program_id,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.vault_program_id,
            false,
        ));
        accounts.extend_from_slice(remaining_accounts);
        let data = RegisterVaultInstructionData::new().try_to_vec().unwrap();

        solana_program::instruction::Instruction {
            program_id: crate::RELAYER_NCN_PROGRAM_ID,
            accounts,
            data,
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct RegisterVaultInstructionData {
    discriminator: u8,
}

impl RegisterVaultInstructionData {
    pub fn new() -> Self {
        Self { discriminator: 4 }
    }
}

impl Default for RegisterVaultInstructionData {
    fn default() -> Self {
        Self::new()
    }
}

/// Instruction builder for `RegisterVault`.
///
/// ### Accounts:
///
///   0. `[]` restaking_config
///   1. `[writable]` vault_registry
///   2. `[]` ncn
///   3. `[]` vault
///   4. `[]` vault_ncn_ticket
///   5. `[]` ncn_vault_ticket
///   6. `[]` restaking_program_id
///   7. `[]` vault_program_id
#[derive(Clone, Debug, Default)]
pub struct RegisterVaultBuilder {
    restaking_config: Option<solana_program::pubkey::Pubkey>,
    vault_registry: Option<solana_program::pubkey::Pubkey>,
    ncn: Option<solana_program::pubkey::Pubkey>,
    vault: Option<solana_program::pubkey::Pubkey>,
    vault_ncn_ticket: Option<solana_program::pubkey::Pubkey>,
    ncn_vault_ticket: Option<solana_program::pubkey::Pubkey>,
    restaking_program_id: Option<solana_program::pubkey::Pubkey>,
    vault_program_id: Option<solana_program::pubkey::Pubkey>,
    __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl RegisterVaultBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    #[inline(always)]
    pub fn restaking_config(
        &mut self,
        restaking_config: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.restaking_config = Some(restaking_config);
        self
    }
    #[inline(always)]
    pub fn vault_registry(&mut self, vault_registry: solana_program::pubkey::Pubkey) -> &mut Self {
        self.vault_registry = Some(vault_registry);
        self
    }
    #[inline(always)]
    pub fn ncn(&mut self, ncn: solana_program::pubkey::Pubkey) -> &mut Self {
        self.ncn = Some(ncn);
        self
    }
    #[inline(always)]
    pub fn vault(&mut self, vault: solana_program::pubkey::Pubkey) -> &mut Self {
        self.vault = Some(vault);
        self
    }
    #[inline(always)]
    pub fn vault_ncn_ticket(
        &mut self,
        vault_ncn_ticket: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.vault_ncn_ticket = Some(vault_ncn_ticket);
        self
    }
    #[inline(always)]
    pub fn ncn_vault_ticket(
        &mut self,
        ncn_vault_ticket: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.ncn_vault_ticket = Some(ncn_vault_ticket);
        self
    }
    #[inline(always)]
    pub fn restaking_program_id(
        &mut self,
        restaking_program_id: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.restaking_program_id = Some(restaking_program_id);
        self
    }
    #[inline(always)]
    pub fn vault_program_id(
        &mut self,
        vault_program_id: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.vault_program_id = Some(vault_program_id);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: solana_program::instruction::AccountMeta,
    ) -> &mut Self {
        self.__remaining_accounts.push(account);
        self
    }
    /// Add additional accounts to the instruction.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[solana_program::instruction::AccountMeta],
    ) -> &mut Self {
        self.__remaining_accounts.extend_from_slice(accounts);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        let accounts = RegisterVault {
            restaking_config: self.restaking_config.expect("restaking_config is not set"),
            vault_registry: self.vault_registry.expect("vault_registry is not set"),
            ncn: self.ncn.expect("ncn is not set"),
            vault: self.vault.expect("vault is not set"),
            vault_ncn_ticket: self.vault_ncn_ticket.expect("vault_ncn_ticket is not set"),
            ncn_vault_ticket: self.ncn_vault_ticket.expect("ncn_vault_ticket is not set"),
            restaking_program_id: self
                .restaking_program_id
                .expect("restaking_program_id is not set"),
            vault_program_id: self.vault_program_id.expect("vault_program_id is not set"),
        };

        accounts.instruction_with_remaining_accounts(&self.__remaining_accounts)
    }
}

/// `register_vault` CPI accounts.
pub struct RegisterVaultCpiAccounts<'a, 'b> {
    pub restaking_config: &'b solana_program::account_info::AccountInfo<'a>,

    pub vault_registry: &'b solana_program::account_info::AccountInfo<'a>,

    pub ncn: &'b solana_program::account_info::AccountInfo<'a>,

    pub vault: &'b solana_program::account_info::AccountInfo<'a>,

    pub vault_ncn_ticket: &'b solana_program::account_info::AccountInfo<'a>,

    pub ncn_vault_ticket: &'b solana_program::account_info::AccountInfo<'a>,

    pub restaking_program_id: &'b solana_program::account_info::AccountInfo<'a>,

    pub vault_program_id: &'b solana_program::account_info::AccountInfo<'a>,
}

/// `register_vault` CPI instruction.
pub struct RegisterVaultCpi<'a, 'b> {
    /// The program to invoke.
    pub __program: &'b solana_program::account_info::AccountInfo<'a>,

    pub restaking_config: &'b solana_program::account_info::AccountInfo<'a>,

    pub vault_registry: &'b solana_program::account_info::AccountInfo<'a>,

    pub ncn: &'b solana_program::account_info::AccountInfo<'a>,

    pub vault: &'b solana_program::account_info::AccountInfo<'a>,

    pub vault_ncn_ticket: &'b solana_program::account_info::AccountInfo<'a>,

    pub ncn_vault_ticket: &'b solana_program::account_info::AccountInfo<'a>,

    pub restaking_program_id: &'b solana_program::account_info::AccountInfo<'a>,

    pub vault_program_id: &'b solana_program::account_info::AccountInfo<'a>,
}

impl<'a, 'b> RegisterVaultCpi<'a, 'b> {
    pub fn new(
        program: &'b solana_program::account_info::AccountInfo<'a>,
        accounts: RegisterVaultCpiAccounts<'a, 'b>,
    ) -> Self {
        Self {
            __program: program,
            restaking_config: accounts.restaking_config,
            vault_registry: accounts.vault_registry,
            ncn: accounts.ncn,
            vault: accounts.vault,
            vault_ncn_ticket: accounts.vault_ncn_ticket,
            ncn_vault_ticket: accounts.ncn_vault_ticket,
            restaking_program_id: accounts.restaking_program_id,
            vault_program_id: accounts.vault_program_id,
        }
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], &[])
    }
    #[inline(always)]
    pub fn invoke_with_remaining_accounts(
        &self,
        remaining_accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
    }
    #[inline(always)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed_with_remaining_accounts(
        &self,
        signers_seeds: &[&[&[u8]]],
        remaining_accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> solana_program::entrypoint::ProgramResult {
        let mut accounts = Vec::with_capacity(8 + remaining_accounts.len());
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.restaking_config.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.vault_registry.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.ncn.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.vault.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.vault_ncn_ticket.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.ncn_vault_ticket.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.restaking_program_id.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.vault_program_id.key,
            false,
        ));
        remaining_accounts.iter().for_each(|remaining_account| {
            accounts.push(solana_program::instruction::AccountMeta {
                pubkey: *remaining_account.0.key,
                is_signer: remaining_account.1,
                is_writable: remaining_account.2,
            })
        });
        let data = RegisterVaultInstructionData::new().try_to_vec().unwrap();

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::RELAYER_NCN_PROGRAM_ID,
            accounts,
            data,
        };
        let mut account_infos = Vec::with_capacity(8 + 1 + remaining_accounts.len());
        account_infos.push(self.__program.clone());
        account_infos.push(self.restaking_config.clone());
        account_infos.push(self.vault_registry.clone());
        account_infos.push(self.ncn.clone());
        account_infos.push(self.vault.clone());
        account_infos.push(self.vault_ncn_ticket.clone());
        account_infos.push(self.ncn_vault_ticket.clone());
        account_infos.push(self.restaking_program_id.clone());
        account_infos.push(self.vault_program_id.clone());
        remaining_accounts
            .iter()
            .for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// Instruction builder for `RegisterVault` via CPI.
///
/// ### Accounts:
///
///   0. `[]` restaking_config
///   1. `[writable]` vault_registry
///   2. `[]` ncn
///   3. `[]` vault
///   4. `[]` vault_ncn_ticket
///   5. `[]` ncn_vault_ticket
///   6. `[]` restaking_program_id
///   7. `[]` vault_program_id
#[derive(Clone, Debug)]
pub struct RegisterVaultCpiBuilder<'a, 'b> {
    instruction: Box<RegisterVaultCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> RegisterVaultCpiBuilder<'a, 'b> {
    pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(RegisterVaultCpiBuilderInstruction {
            __program: program,
            restaking_config: None,
            vault_registry: None,
            ncn: None,
            vault: None,
            vault_ncn_ticket: None,
            ncn_vault_ticket: None,
            restaking_program_id: None,
            vault_program_id: None,
            __remaining_accounts: Vec::new(),
        });
        Self { instruction }
    }
    #[inline(always)]
    pub fn restaking_config(
        &mut self,
        restaking_config: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.restaking_config = Some(restaking_config);
        self
    }
    #[inline(always)]
    pub fn vault_registry(
        &mut self,
        vault_registry: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.vault_registry = Some(vault_registry);
        self
    }
    #[inline(always)]
    pub fn ncn(&mut self, ncn: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.ncn = Some(ncn);
        self
    }
    #[inline(always)]
    pub fn vault(&mut self, vault: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.vault = Some(vault);
        self
    }
    #[inline(always)]
    pub fn vault_ncn_ticket(
        &mut self,
        vault_ncn_ticket: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.vault_ncn_ticket = Some(vault_ncn_ticket);
        self
    }
    #[inline(always)]
    pub fn ncn_vault_ticket(
        &mut self,
        ncn_vault_ticket: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.ncn_vault_ticket = Some(ncn_vault_ticket);
        self
    }
    #[inline(always)]
    pub fn restaking_program_id(
        &mut self,
        restaking_program_id: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.restaking_program_id = Some(restaking_program_id);
        self
    }
    #[inline(always)]
    pub fn vault_program_id(
        &mut self,
        vault_program_id: &'b solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.vault_program_id = Some(vault_program_id);
        self
    }
    /// Add an additional account to the instruction.
    #[inline(always)]
    pub fn add_remaining_account(
        &mut self,
        account: &'b solana_program::account_info::AccountInfo<'a>,
        is_writable: bool,
        is_signer: bool,
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .push((account, is_writable, is_signer));
        self
    }
    /// Add additional accounts to the instruction.
    ///
    /// Each account is represented by a tuple of the `AccountInfo`, a `bool` indicating whether the account is writable or not,
    /// and a `bool` indicating whether the account is a signer or not.
    #[inline(always)]
    pub fn add_remaining_accounts(
        &mut self,
        accounts: &[(
            &'b solana_program::account_info::AccountInfo<'a>,
            bool,
            bool,
        )],
    ) -> &mut Self {
        self.instruction
            .__remaining_accounts
            .extend_from_slice(accounts);
        self
    }
    #[inline(always)]
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let instruction = RegisterVaultCpi {
            __program: self.instruction.__program,

            restaking_config: self
                .instruction
                .restaking_config
                .expect("restaking_config is not set"),

            vault_registry: self
                .instruction
                .vault_registry
                .expect("vault_registry is not set"),

            ncn: self.instruction.ncn.expect("ncn is not set"),

            vault: self.instruction.vault.expect("vault is not set"),

            vault_ncn_ticket: self
                .instruction
                .vault_ncn_ticket
                .expect("vault_ncn_ticket is not set"),

            ncn_vault_ticket: self
                .instruction
                .ncn_vault_ticket
                .expect("ncn_vault_ticket is not set"),

            restaking_program_id: self
                .instruction
                .restaking_program_id
                .expect("restaking_program_id is not set"),

            vault_program_id: self
                .instruction
                .vault_program_id
                .expect("vault_program_id is not set"),
        };
        instruction.invoke_signed_with_remaining_accounts(
            signers_seeds,
            &self.instruction.__remaining_accounts,
        )
    }
}

#[derive(Clone, Debug)]
struct RegisterVaultCpiBuilderInstruction<'a, 'b> {
    __program: &'b solana_program::account_info::AccountInfo<'a>,
    restaking_config: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    vault_registry: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    ncn: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    vault: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    vault_ncn_ticket: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    ncn_vault_ticket: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    restaking_program_id: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    vault_program_id: Option<&'b solana_program::account_info::AccountInfo<'a>>,
    /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
    __remaining_accounts: Vec<(
        &'b solana_program::account_info::AccountInfo<'a>,
        bool,
        bool,
    )>,
}
