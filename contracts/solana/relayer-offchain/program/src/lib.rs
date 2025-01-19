mod initialize_ncn_config;
mod admin_register_st_mint;
mod initialize_vault_registry;
mod realloc_vault_registry;
mod register_vault;
mod initialize_weight_table;
mod realloc_weight_table;
mod admin_set_weight;
mod initialize_epoch_snapshot;
mod initialize_operator_snapshot;
mod realloc_operator_snapshot;
mod snapshot_vault_operator_delegation;
mod initialize_ballot_box;
mod realloc_ballot_box;
mod cast_vote;
mod send_transaction;

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
use crate::{
    initialize_ncn_config::process_initialize_ncn_config,
    admin_register_st_mint::process_admin_register_st_mint,
    admin_set_weight::process_admin_set_weight,
    cast_vote::process_cast_vote,
    initialize_ballot_box::process_initialize_ballot_box,
    initialize_epoch_snapshot::process_initialize_epoch_snapshot,
    initialize_operator_snapshot::process_initialize_operator_snapshot,
    initialize_vault_registry::process_initialize_vault_registry,
    initialize_weight_table::process_initialize_weight_table,
    realloc_ballot_box::process_realloc_ballot_box,
    realloc_operator_snapshot::process_realloc_operator_snapshot,
    realloc_vault_registry::process_realloc_vault_registry,
    realloc_weight_table::process_realloc_weight_table,
    register_vault::process_register_vault,
    send_transaction::process_send_transaction,
    snapshot_vault_operator_delegation::process_snapshot_vault_operator_delegation,
};

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
        RelayerNcnInstruction::InitializeVaultRegistry => {
            msg!("Instruction: InitializeVaultRegistry");
            process_initialize_vault_registry(program_id, accounts)
        }
        RelayerNcnInstruction::ReallocVaultRegistry => {
            msg!("Instruction: ReallocVaultRegistry");
            process_realloc_vault_registry(program_id, accounts)
        }
        RelayerNcnInstruction::AdminRegisterStMint {
            // ncn_fee_group,
            reward_multiplier_bps,
            // switchboard_feed,
            no_feed_weight,
        } => {
            msg!("Instruction: AdminRegisterStMint");
            process_admin_register_st_mint(
                program_id,
                accounts,
                // ncn_fee_group,
                reward_multiplier_bps,
                // switchboard_feed,
                no_feed_weight,
            )
        }
        RelayerNcnInstruction::RegisterVault => {
            msg!("Instruction: RegisterVault");
            process_register_vault(program_id, accounts)
        }
        RelayerNcnInstruction::InitializeWeightTable { epoch } => {
            msg!("Instruction: InitializeWeightTable");
            process_initialize_weight_table(program_id, accounts, epoch)
        }
        RelayerNcnInstruction::ReallocWeightTable { epoch } => {
            msg!("Instruction: ReallocWeightTable");
            process_realloc_weight_table(program_id, accounts, epoch)
        }

        RelayerNcnInstruction::AdminSetWeight {
            st_mint,
            weight,
            epoch,
        } => {
            msg!("Instruction: AdminSetWeight");
            process_admin_set_weight(program_id, accounts, &st_mint, epoch, weight)
        }
        RelayerNcnInstruction::InitializeEpochSnapshot { epoch } => {
            msg!("Instruction: InitializeEpochSnapshot");
            process_initialize_epoch_snapshot(program_id, accounts, epoch)
        }
        RelayerNcnInstruction::InitializeOperatorSnapshot { epoch } => {
            msg!("Instruction: InitializeOperatorSnapshot");
            process_initialize_operator_snapshot(program_id, accounts, epoch)
        }
        RelayerNcnInstruction::ReallocOperatorSnapshot { epoch } => {
            msg!("Instruction: ReallocOperatorSnapshot");
            process_realloc_operator_snapshot(program_id, accounts, epoch)
        }
        RelayerNcnInstruction::SnapshotVaultOperatorDelegation { epoch } => {
            msg!("Instruction: SnapshotVaultOperatorDelegation");
            process_snapshot_vault_operator_delegation(program_id, accounts, epoch)
        }
        RelayerNcnInstruction::InitializeBallotBox { epoch } => {
            msg!("Instruction: InitializeBallotBox");
            process_initialize_ballot_box(program_id, accounts, epoch)
        }
        RelayerNcnInstruction::ReallocBallotBox { epoch } => {
            msg!("Instruction: ReallocBallotBox");
            process_realloc_ballot_box(program_id, accounts, epoch)
        }
        RelayerNcnInstruction::CastVote {
            meta_merkle_root,
            epoch,
        } => {
            msg!("Instruction: CastVote");
            process_cast_vote(program_id, accounts, &meta_merkle_root, epoch)
        }
        RelayerNcnInstruction::SendTransaction {
            epoch,
            chain,
            sequence,
        } => {
            msg!("Instruction: SendTransaction");
            process_send_transaction(
                program_id,
                accounts,
                epoch,
                chain,
                sequence,
            )
        }
    }
}