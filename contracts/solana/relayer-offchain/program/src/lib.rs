mod initialize_ncn_config;

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
    declare_id,
};
use const_str_to_pubkey::str_to_pubkey;
use shank::ShankInstruction;
use shank::{ShankAccount, ShankType};
use relayer_ncn_core::instruction::RelayerNcnInstruction;
use crate::initialize_ncn_config::process_initialize_ncn_config;

declare_id!(str_to_pubkey(env!("RELAYER_NCN_PROGRAM_ID")));

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;
#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    // Required fields
    name: "Jito's MEV Tip Distribution NCN Program",
    project_url: "https://jito.network/",
    contacts: "email:team@jito.network",
    policy: "https://github.com/jito-foundation/jito-tip-router",
    // Optional Fields
    preferred_languages: "en",
    source_code: "https://github.com/jito-foundation/jito-tip-router"
}


#[cfg(not(feature = "no-entrypoint"))]
solana_program::entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if *program_id != id() {
        return Err(ProgramError::IncorrectProgramId);
    }

    let instruction = RelayerNcnInstruction::try_from_slice(instruction_data)?;

    match instruction {
        // ---------------------------------------------------- //
        //                         GLOBAL                       //
        // ---------------------------------------------------- //
        RelayerNcnInstruction::InitializeConfig {
            epochs_before_stall,
            valid_slots_after_consensus,
        } => {
            msg!("Instruction: InitializeConfig");
            process_initialize_ncn_config(
                program_id,
                accounts,
                epochs_before_stall,
                valid_slots_after_consensus,
            )
        }
    }
}