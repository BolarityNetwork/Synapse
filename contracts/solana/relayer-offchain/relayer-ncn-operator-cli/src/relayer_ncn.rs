use anyhow::Result;
use ellipsis_client::{ClientSubset, EllipsisClient, EllipsisClientResult};
use jito_bytemuck::AccountDeserialize;
use relayer_ncn_client::instructions::CastVoteBuilder;
use relayer_ncn_core::{
    ballot_box::BallotBox,
    config::Config,
    epoch_snapshot::{EpochSnapshot, OperatorSnapshot},
};
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    transaction::Transaction,
};
use relayer_hub_client::accounts::EpochSequence;
use relayer_hub_client::programs::RELAYER_HUB_ID as relayer_hub_program_id;
use relayer_hub_client::types::Status;
use relayer_hub_client::accounts::Transaction as HubTransaction;
use relayer_hub_client::instructions::FinalizeTransactionBuilder;

/// Fetch and deserialize
pub async fn get_ncn_config(client: &EllipsisClient, ncn_pubkey: &Pubkey) -> Result<Config> {
    let config_pda = Config::find_program_address(&relayer_ncn_program::id(), ncn_pubkey).0;
    let config = client.get_account(&config_pda).await?;
    Ok(*Config::try_from_slice_unchecked(config.data.as_slice()).unwrap())
}

/// Generate and send a CastVote instruction with the state root.
pub async fn cast_vote(
    client: &EllipsisClient,
    payer: &Keypair,
    ncn: Pubkey,
    operator: Pubkey,
    operator_voter: &Keypair,
    state_root: [u8; 32],
    epoch: u64,
) -> EllipsisClientResult<Signature> {
    let ncn_config = Config::find_program_address(&relayer_ncn_program::id(), &ncn).0;

    let ballot_box = BallotBox::find_program_address(&relayer_ncn_program::id(), &ncn, epoch).0;

    let epoch_snapshot =
        EpochSnapshot::find_program_address(&relayer_ncn_program::id(), &ncn, epoch).0;

    let operator_snapshot = OperatorSnapshot::find_program_address(
        &relayer_ncn_program::id(),
        &operator,
        &ncn,
        epoch,
    )
        .0;

    let ix = CastVoteBuilder::new()
        .config(ncn_config)
        .ballot_box(ballot_box)
        .ncn(ncn)
        .epoch_snapshot(epoch_snapshot)
        .operator_snapshot(operator_snapshot)
        .operator(operator)
        // .operator_voter(operator_voter.pubkey())
        .meta_merkle_root(state_root)
        .epoch(epoch)
        .instruction();

    let tx = Transaction::new_with_payer(&[ix], Some(&payer.pubkey()));
    client
        .process_transaction(tx, &[payer, operator_voter])
        .await
}

pub async fn get_all_can_finalize_tx(
    client: &EllipsisClient,
    epoch: u64,
) -> EllipsisClientResult<(u64, u64)> {
    let (epoch_sequence_address, _) =
        relayer_hub_sdk::derive_epoch_sequence_address(
            &relayer_hub_program_id,
            epoch
        );

    let pool_account = client
        .get_account(&epoch_sequence_address)
        .await?;
    let mut pool_account_data = pool_account.data.as_slice();
    let es = EpochSequence::from_bytes(&mut pool_account_data)?;

    Ok((es.begin_sequence, es.current_sequence))
}

pub async fn get_tx_status(
    client: &EllipsisClient,
    sequence: u64,
) -> EllipsisClientResult<Status> {
    let (pool_address, _) =
        relayer_hub_sdk::derive_transaction_account_address(
            &relayer_hub_program_id,
            sequence
        );

    let pool_account = client
        .get_account(&pool_address)
        .await?;
    let mut pool_account_data = pool_account.data.as_slice();
    let tx = HubTransaction::from_bytes(&mut pool_account_data)?;

    Ok::<Status, _>(tx.status)
}

pub async fn get_tx(
    client: &EllipsisClient,
    sequence: u64,
) -> EllipsisClientResult<HubTransaction> {
    let (pool_address, _) =
        relayer_hub_sdk::derive_transaction_account_address(
            &relayer_hub_program_id,
            sequence
        );

    let pool_account = client
        .get_account(&pool_address)
        .await?;
    let mut pool_account_data = pool_account.data.as_slice();
    let tx = HubTransaction::from_bytes(&mut pool_account_data)?;

    Ok(tx)
}

pub async fn do_finalize_transaction(
    client: &EllipsisClient,
    sequence: u64,
    payer: &Keypair,
    finalize: bool,
    state_root:[u8;32]
) -> EllipsisClientResult<Signature> {
    let system_program = solana_program::system_program::id();
    let (hub_config, _) =relayer_hub_sdk::derive_config_account_address(&relayer_hub_program_id);
    let (transaction, _) =relayer_hub_sdk::derive_transaction_account_address(&relayer_hub_program_id, sequence);

    finalize_transaction(
        client,
        hub_config,
        transaction,
        system_program,
        sequence,
        payer,
        finalize,
        state_root,
    )
        .await
}

pub async fn finalize_transaction(
    client: &EllipsisClient,
    hub_config: Pubkey,
    transaction: Pubkey,
    system_program: Pubkey,
    sequence: u64,
    payer: &Keypair,
    finalize: bool,
    state_root:[u8;32]
) -> EllipsisClientResult<Signature> {
    let ix = FinalizeTransactionBuilder::new()
        .config(hub_config)
        .operator(payer.pubkey())
        .transaction(transaction)
        .system_program(system_program)
        .sequence(sequence)
        .finalize(finalize)
        .state_root(state_root)
        .instruction();
    let tx = Transaction::new_with_payer(&[ix], Some(&payer.pubkey()));
    client
        .process_transaction(tx, &[payer])
        .await
}