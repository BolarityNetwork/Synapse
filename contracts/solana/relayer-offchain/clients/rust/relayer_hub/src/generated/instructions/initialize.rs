//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use solana_program::pubkey::Pubkey;
use borsh::BorshSerialize;
use borsh::BorshDeserialize;

/// Accounts.
pub struct Initialize {
            /// Program configuration account.which saves program data useful for other instructions.
/// Also saves the payer of the initialize instruction as the program's owner.

    
              
          pub config: solana_program::pubkey::Pubkey,
                /// Relayer configuration account.Used to store data related to relayer configuration.

    
              
          pub relayer_info: solana_program::pubkey::Pubkey,
                /// Owner of program.

    
              
          pub payer: solana_program::pubkey::Pubkey,
                /// System program.

    
              
          pub system_program: solana_program::pubkey::Pubkey,
      }

impl Initialize {
  pub fn instruction(&self, args: InitializeInstructionArgs) -> solana_program::instruction::Instruction {
    self.instruction_with_remaining_accounts(args, &[])
  }
  #[allow(clippy::vec_init_then_push)]
  pub fn instruction_with_remaining_accounts(&self, args: InitializeInstructionArgs, remaining_accounts: &[solana_program::instruction::AccountMeta]) -> solana_program::instruction::Instruction {
    let mut accounts = Vec::with_capacity(4+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            self.config,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.relayer_info,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.payer,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.system_program,
            false
          ));
                      accounts.extend_from_slice(remaining_accounts);
    let mut data = InitializeInstructionData::new().try_to_vec().unwrap();
          let mut args = args.try_to_vec().unwrap();
      data.append(&mut args);
    
    solana_program::instruction::Instruction {
      program_id: crate::RELAYER_HUB_ID,
      accounts,
      data,
    }
  }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
 pub struct InitializeInstructionData {
            discriminator: [u8; 8],
            }

impl InitializeInstructionData {
  pub fn new() -> Self {
    Self {
                        discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
                                }
  }
}

impl Default for InitializeInstructionData {
  fn default() -> Self {
    Self::new()
  }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
 pub struct InitializeInstructionArgs {
                  pub authority: Pubkey,
      }


/// Instruction builder for `Initialize`.
///
/// ### Accounts:
///
                ///   0. `[writable]` config
                ///   1. `[writable]` relayer_info
                      ///   2. `[writable, signer]` payer
                ///   3. `[optional]` system_program (default to `11111111111111111111111111111111`)
#[derive(Clone, Debug, Default)]
pub struct InitializeBuilder {
            config: Option<solana_program::pubkey::Pubkey>,
                relayer_info: Option<solana_program::pubkey::Pubkey>,
                payer: Option<solana_program::pubkey::Pubkey>,
                system_program: Option<solana_program::pubkey::Pubkey>,
                        authority: Option<Pubkey>,
        __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl InitializeBuilder {
  pub fn new() -> Self {
    Self::default()
  }
            /// Program configuration account.which saves program data useful for other instructions.
/// Also saves the payer of the initialize instruction as the program's owner.
#[inline(always)]
    pub fn config(&mut self, config: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.config = Some(config);
                    self
    }
            /// Relayer configuration account.Used to store data related to relayer configuration.
#[inline(always)]
    pub fn relayer_info(&mut self, relayer_info: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.relayer_info = Some(relayer_info);
                    self
    }
            /// Owner of program.
#[inline(always)]
    pub fn payer(&mut self, payer: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.payer = Some(payer);
                    self
    }
            /// `[optional account, default to '11111111111111111111111111111111']`
/// System program.
#[inline(always)]
    pub fn system_program(&mut self, system_program: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.system_program = Some(system_program);
                    self
    }
                    #[inline(always)]
      pub fn authority(&mut self, authority: Pubkey) -> &mut Self {
        self.authority = Some(authority);
        self
      }
        /// Add an additional account to the instruction.
  #[inline(always)]
  pub fn add_remaining_account(&mut self, account: solana_program::instruction::AccountMeta) -> &mut Self {
    self.__remaining_accounts.push(account);
    self
  }
  /// Add additional accounts to the instruction.
  #[inline(always)]
  pub fn add_remaining_accounts(&mut self, accounts: &[solana_program::instruction::AccountMeta]) -> &mut Self {
    self.__remaining_accounts.extend_from_slice(accounts);
    self
  }
  #[allow(clippy::clone_on_copy)]
  pub fn instruction(&self) -> solana_program::instruction::Instruction {
    let accounts = Initialize {
                              config: self.config.expect("config is not set"),
                                        relayer_info: self.relayer_info.expect("relayer_info is not set"),
                                        payer: self.payer.expect("payer is not set"),
                                        system_program: self.system_program.unwrap_or(solana_program::pubkey!("11111111111111111111111111111111")),
                      };
          let args = InitializeInstructionArgs {
                                                              authority: self.authority.clone().expect("authority is not set"),
                                    };
    
    accounts.instruction_with_remaining_accounts(args, &self.__remaining_accounts)
  }
}

  /// `initialize` CPI accounts.
  pub struct InitializeCpiAccounts<'a, 'b> {
                  /// Program configuration account.which saves program data useful for other instructions.
/// Also saves the payer of the initialize instruction as the program's owner.

      
                    
              pub config: &'b solana_program::account_info::AccountInfo<'a>,
                        /// Relayer configuration account.Used to store data related to relayer configuration.

      
                    
              pub relayer_info: &'b solana_program::account_info::AccountInfo<'a>,
                        /// Owner of program.

      
                    
              pub payer: &'b solana_program::account_info::AccountInfo<'a>,
                        /// System program.

      
                    
              pub system_program: &'b solana_program::account_info::AccountInfo<'a>,
            }

/// `initialize` CPI instruction.
pub struct InitializeCpi<'a, 'b> {
  /// The program to invoke.
  pub __program: &'b solana_program::account_info::AccountInfo<'a>,
            /// Program configuration account.which saves program data useful for other instructions.
/// Also saves the payer of the initialize instruction as the program's owner.

    
              
          pub config: &'b solana_program::account_info::AccountInfo<'a>,
                /// Relayer configuration account.Used to store data related to relayer configuration.

    
              
          pub relayer_info: &'b solana_program::account_info::AccountInfo<'a>,
                /// Owner of program.

    
              
          pub payer: &'b solana_program::account_info::AccountInfo<'a>,
                /// System program.

    
              
          pub system_program: &'b solana_program::account_info::AccountInfo<'a>,
            /// The arguments for the instruction.
    pub __args: InitializeInstructionArgs,
  }

impl<'a, 'b> InitializeCpi<'a, 'b> {
  pub fn new(
    program: &'b solana_program::account_info::AccountInfo<'a>,
          accounts: InitializeCpiAccounts<'a, 'b>,
              args: InitializeInstructionArgs,
      ) -> Self {
    Self {
      __program: program,
              config: accounts.config,
              relayer_info: accounts.relayer_info,
              payer: accounts.payer,
              system_program: accounts.system_program,
                    __args: args,
          }
  }
  #[inline(always)]
  pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(&[], &[])
  }
  #[inline(always)]
  pub fn invoke_with_remaining_accounts(&self, remaining_accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
  }
  #[inline(always)]
  pub fn invoke_signed(&self, signers_seeds: &[&[&[u8]]]) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
  }
  #[allow(clippy::clone_on_copy)]
  #[allow(clippy::vec_init_then_push)]
  pub fn invoke_signed_with_remaining_accounts(
    &self,
    signers_seeds: &[&[&[u8]]],
    remaining_accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]
  ) -> solana_program::entrypoint::ProgramResult {
    let mut accounts = Vec::with_capacity(4+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            *self.config.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.relayer_info.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.payer.key,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.system_program.key,
            false
          ));
                      remaining_accounts.iter().for_each(|remaining_account| {
      accounts.push(solana_program::instruction::AccountMeta {
          pubkey: *remaining_account.0.key,
          is_signer: remaining_account.1,
          is_writable: remaining_account.2,
      })
    });
    let mut data = InitializeInstructionData::new().try_to_vec().unwrap();
          let mut args = self.__args.try_to_vec().unwrap();
      data.append(&mut args);
    
    let instruction = solana_program::instruction::Instruction {
      program_id: crate::RELAYER_HUB_ID,
      accounts,
      data,
    };
    let mut account_infos = Vec::with_capacity(5 + remaining_accounts.len());
    account_infos.push(self.__program.clone());
                  account_infos.push(self.config.clone());
                        account_infos.push(self.relayer_info.clone());
                        account_infos.push(self.payer.clone());
                        account_infos.push(self.system_program.clone());
              remaining_accounts.iter().for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

    if signers_seeds.is_empty() {
      solana_program::program::invoke(&instruction, &account_infos)
    } else {
      solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
    }
  }
}

/// Instruction builder for `Initialize` via CPI.
///
/// ### Accounts:
///
                ///   0. `[writable]` config
                ///   1. `[writable]` relayer_info
                      ///   2. `[writable, signer]` payer
          ///   3. `[]` system_program
#[derive(Clone, Debug)]
pub struct InitializeCpiBuilder<'a, 'b> {
  instruction: Box<InitializeCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> InitializeCpiBuilder<'a, 'b> {
  pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
    let instruction = Box::new(InitializeCpiBuilderInstruction {
      __program: program,
              config: None,
              relayer_info: None,
              payer: None,
              system_program: None,
                                            authority: None,
                    __remaining_accounts: Vec::new(),
    });
    Self { instruction }
  }
      /// Program configuration account.which saves program data useful for other instructions.
/// Also saves the payer of the initialize instruction as the program's owner.
#[inline(always)]
    pub fn config(&mut self, config: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.config = Some(config);
                    self
    }
      /// Relayer configuration account.Used to store data related to relayer configuration.
#[inline(always)]
    pub fn relayer_info(&mut self, relayer_info: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.relayer_info = Some(relayer_info);
                    self
    }
      /// Owner of program.
#[inline(always)]
    pub fn payer(&mut self, payer: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.payer = Some(payer);
                    self
    }
      /// System program.
#[inline(always)]
    pub fn system_program(&mut self, system_program: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.system_program = Some(system_program);
                    self
    }
                    #[inline(always)]
      pub fn authority(&mut self, authority: Pubkey) -> &mut Self {
        self.instruction.authority = Some(authority);
        self
      }
        /// Add an additional account to the instruction.
  #[inline(always)]
  pub fn add_remaining_account(&mut self, account: &'b solana_program::account_info::AccountInfo<'a>, is_writable: bool, is_signer: bool) -> &mut Self {
    self.instruction.__remaining_accounts.push((account, is_writable, is_signer));
    self
  }
  /// Add additional accounts to the instruction.
  ///
  /// Each account is represented by a tuple of the `AccountInfo`, a `bool` indicating whether the account is writable or not,
  /// and a `bool` indicating whether the account is a signer or not.
  #[inline(always)]
  pub fn add_remaining_accounts(&mut self, accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]) -> &mut Self {
    self.instruction.__remaining_accounts.extend_from_slice(accounts);
    self
  }
  #[inline(always)]
  pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed(&[])
  }
  #[allow(clippy::clone_on_copy)]
  #[allow(clippy::vec_init_then_push)]
  pub fn invoke_signed(&self, signers_seeds: &[&[&[u8]]]) -> solana_program::entrypoint::ProgramResult {
          let args = InitializeInstructionArgs {
                                                              authority: self.instruction.authority.clone().expect("authority is not set"),
                                    };
        let instruction = InitializeCpi {
        __program: self.instruction.__program,
                  
          config: self.instruction.config.expect("config is not set"),
                  
          relayer_info: self.instruction.relayer_info.expect("relayer_info is not set"),
                  
          payer: self.instruction.payer.expect("payer is not set"),
                  
          system_program: self.instruction.system_program.expect("system_program is not set"),
                          __args: args,
            };
    instruction.invoke_signed_with_remaining_accounts(signers_seeds, &self.instruction.__remaining_accounts)
  }
}

#[derive(Clone, Debug)]
struct InitializeCpiBuilderInstruction<'a, 'b> {
  __program: &'b solana_program::account_info::AccountInfo<'a>,
            config: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                relayer_info: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                payer: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                system_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                        authority: Option<Pubkey>,
        /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
  __remaining_accounts: Vec<(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)>,
}

