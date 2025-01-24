use jito_bytemuck::AccountDeserialize;
use jito_restaking_core::ncn::Ncn;
use relayer_ncn_core::{
    ballot_box::BallotBox, config::Config as NcnConfig, error::RelayerNcnError,
};
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, msg, program::invoke_signed,
    program_error::ProgramError, pubkey::Pubkey,
};
use relayer_hub_sdk::instruction::rollup_transaction;
use relayer_ncn_core::final_transaction::FinalTransaction;

pub fn process_rollup_transaction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    epoch: u64,
) -> ProgramResult {
    let [ncn_config, ncn, ballot_box, hub_config,pool, relayer_hub_program_id, restaking_program_id, system_program,transaction] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    NcnConfig::load(program_id, ncn.key, ncn_config, true)?;
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

    let (final_transaction_pubkey, final_transaction_bump, mut final_transaction_seeds) =
        FinalTransaction::find_program_address(relayer_hub_program_id.key, epoch);
    final_transaction_seeds.push(vec![final_transaction_bump]);

    if final_transaction_pubkey.ne(transaction.key) {
        msg!("Incorrect final transaction PDA");
        return Err(ProgramError::InvalidAccountData);
    }

    let accept = true;
    let state_root = ballot_box.get_winning_ballot()?.root();
    let vote = ballot_box.get_votes();
    invoke_signed(
        &rollup_transaction(
            *ncn_config.key,
            *hub_config.key,
            *pool.key,
            *transaction.key,
            *system_program.key,
            accept, state_root, vote, epoch
        ),
        &[
            ncn_config.clone(),
            hub_config.clone(),
            pool.clone(),
            transaction.clone(),
            system_program.clone(),
        ],
        &[ncn_config_seeds
            .iter()
            .map(|s| s.as_slice())
            .collect::<Vec<&[u8]>>()
            .as_slice()],
    )?;

    Ok(())
}
