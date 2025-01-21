use jito_bytemuck::AccountDeserialize;
use jito_jsm_core::loader::load_system_program;
use jito_restaking_core::ncn::Ncn;
use relayer_hub_sdk::{
    // instruction::send_transaction,
    derive_relayer_info_account_address,
    derive_relayer_account_address,
    derive_pool_account_address,
    derive_config_account_address,
    derive_transaction_account_address,
};
use relayer_ncn_core::{
    ballot_box::BallotBox, config::Config as NcnConfig, error::RelayerNcnError,
};
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, msg, program::invoke_signed,
    program_error::ProgramError, pubkey::Pubkey,
};

pub fn process_send_transaction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    epoch: u64,
    chain: u16,
    sequence: u64,
) -> ProgramResult {
    let [ncn_config, ncn, ballot_box, hub_config,relayer_info,pool, relayer_hub_program_id, restaking_program_id, system_program] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };
    load_system_program(system_program)?;
    Ncn::load(restaking_program_id.key, ncn, false)?;
    BallotBox::load(program_id, ncn.key, epoch, ballot_box, false)?;

    let ballot_box_data = ballot_box.data.borrow();
    let ballot_box = BallotBox::try_from_slice_unchecked(&ballot_box_data)?;

    if !ballot_box.is_consensus_reached() {
        msg!("Ballot box not finalized");
        return Err(RelayerNcnError::ConsensusNotReached.into());
    }

    let (_, bump, mut ncn_config_seeds) = NcnConfig::find_program_address(program_id, ncn.key);
    ncn_config_seeds.push(vec![bump]);

    // invoke_signed(
    //     &send_transaction(
    //         *hub_config.key,
    //         *pool.key,
    //         *ncn_config.key,
    //         *relayer_info.key,
    //         *system_program.key,
    //         chain,
    //         sequence,
    //     ),
    //     &[
    //         ncn_config.clone(),
    //         hub_config.clone(),
    //         relayer_info.clone(),
    //         pool.clone(),
    //         system_program.clone(),
    //     ],
    //     &[ncn_config_seeds
    //         .iter()
    //         .map(|s| s.as_slice())
    //         .collect::<Vec<&[u8]>>()
    //         .as_slice()],
    // )?;

    Ok(())
}
