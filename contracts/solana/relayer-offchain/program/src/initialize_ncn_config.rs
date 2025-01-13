use jito_bytemuck::{AccountDeserialize, Discriminator};
use jito_jsm_core::{
    create_account,
    loader::{load_signer, load_system_account, load_system_program},
};
use jito_restaking_core::ncn::Ncn;
use relayer_ncn_core::{
    config::Config,
    constants::{
        MAX_EPOCHS_BEFORE_STALL, MAX_FEE_BPS, MAX_SLOTS_AFTER_CONSENSUS, MIN_EPOCHS_BEFORE_STALL,
        MIN_SLOTS_AFTER_CONSENSUS,
    },
    error::RelayerNcnError,
};
use solana_program::{
    account_info::AccountInfo, clock::Clock, entrypoint::ProgramResult,
    program_error::ProgramError, pubkey::Pubkey, rent::Rent, sysvar::Sysvar,
};

pub fn process_initialize_ncn_config(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    epochs_before_stall: u64,
    valid_slots_after_consensus: u64,
) -> ProgramResult {
    let [config, ncn_account, ncn_admin, restaking_program, system_program] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    load_system_account(config, true)?;
    load_system_program(system_program)?;
    load_signer(ncn_admin, false)?;

    Ncn::load(restaking_program.key, ncn_account, false)?;

    let epoch = Clock::get()?.epoch;

    let ncn_data = ncn_account.data.borrow();
    let ncn = Ncn::try_from_slice_unchecked(&ncn_data)?;
    if ncn.admin != *ncn_admin.key {
        return Err(RelayerNcnError::IncorrectNcnAdmin.into());
    }

    let (config_pda, config_bump, mut config_seeds) =
        Config::find_program_address(program_id, ncn_account.key);
    config_seeds.push(vec![config_bump]);

    if config_pda != *config.key {
        return Err(ProgramError::InvalidSeeds);
    }

    if !(MIN_EPOCHS_BEFORE_STALL..=MAX_EPOCHS_BEFORE_STALL).contains(&epochs_before_stall) {
        return Err(RelayerNcnError::InvalidEpochsBeforeStall.into());
    }

    if !(MIN_SLOTS_AFTER_CONSENSUS..=MAX_SLOTS_AFTER_CONSENSUS)
        .contains(&valid_slots_after_consensus)
    {
        return Err(RelayerNcnError::InvalidSlotsAfterConsensus.into());
    }

    create_account(
        ncn_admin,
        config,
        system_program,
        program_id,
        &Rent::get()?,
        8_u64
            .checked_add(std::mem::size_of::<Config>() as u64)
            .unwrap(),
        &config_seeds,
    )?;

    let mut config_data = config.try_borrow_mut_data()?;
    config_data[0] = Config::DISCRIMINATOR;
    let config = Config::try_from_slice_unchecked_mut(&mut config_data)?;

    *config = Config::new(
        ncn_account.key,
        valid_slots_after_consensus,
        epochs_before_stall,
        config_bump,
    );

    Ok(())
}
