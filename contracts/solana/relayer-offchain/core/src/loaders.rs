use jito_bytemuck::AccountDeserialize;
use jito_restaking_core::config::Config;
use solana_program::{account_info::AccountInfo, msg, program_error::ProgramError, pubkey::Pubkey};

use crate::error::RelayerNcnError;

pub fn load_ncn_epoch(
    restaking_config: &AccountInfo,
    current_slot: u64,
    first_slot_of_ncn_epoch: Option<u64>,
) -> Result<(u64, u64), ProgramError> {
    let ncn_epoch_length = {
        let config_data = restaking_config.data.borrow();
        let config = Config::try_from_slice_unchecked(&config_data)?;
        config.epoch_length()
    };

    let current_ncn_epoch = current_slot
        .checked_div(ncn_epoch_length)
        .ok_or(RelayerNcnError::DenominatorIsZero)?;

    let ncn_epoch_slot = first_slot_of_ncn_epoch.unwrap_or(current_slot);
    let ncn_epoch = ncn_epoch_slot
        .checked_div(ncn_epoch_length)
        .ok_or(RelayerNcnError::DenominatorIsZero)?;

    if ncn_epoch > current_ncn_epoch {
        msg!("Epoch snapshots can only be initialized for current or past epochs");
        return Err(RelayerNcnError::CannotCreateFutureWeightTables.into());
    }

    Ok((ncn_epoch, ncn_epoch_length))
}

pub fn check_load(
    program_id: &Pubkey,
    account: &AccountInfo,
    expected_pda: &Pubkey,
    expected_discriminator: Option<u8>,
    expect_writable: bool,
) -> Result<(), ProgramError> {
    if account.owner.ne(program_id) {
        msg!("Account has an invalid owner");
        return Err(ProgramError::InvalidAccountOwner);
    }

    if account.key.ne(expected_pda) {
        msg!("Account is not at the correct PDA");
        return Err(ProgramError::InvalidAccountData);
    }

    if let Some(discriminator) = expected_discriminator {
        if account.data_is_empty() {
            msg!("Account data is empty");
            return Err(ProgramError::InvalidAccountData);
        }

        if account.data.borrow()[0].ne(&discriminator) {
            msg!("Account discriminator is invalid");
            return Err(ProgramError::InvalidAccountData);
        }
    }

    if expect_writable && !account.is_writable {
        msg!("Account is not writable");
        return Err(ProgramError::InvalidAccountData);
    }

    Ok(())
}