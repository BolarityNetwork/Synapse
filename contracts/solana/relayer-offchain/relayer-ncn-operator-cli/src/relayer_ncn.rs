use anyhow::Result;
use ellipsis_client::{ClientSubset, EllipsisClient, EllipsisClientResult};
use jito_bytemuck::AccountDeserialize;
use relayer_ncn_client::instructions::{CastVoteBuilder, RollupTransactionBuilder};
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
use relayer_hub_client::accounts::{EpochSequence, ExtendTransaction, FinalTransaction};
use relayer_hub_client::programs::RELAYER_HUB_ID as relayer_hub_program_id;
use relayer_hub_client::types::Status;
use relayer_hub_client::accounts::Transaction as HubTransaction;
use relayer_hub_client::instructions::FinalizeTransactionBuilder;
use relayer_hub_sdk::relayer_hub;

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
        .operator_admin(payer.pubkey())
        .restaking_program(jito_restaking_program::id())
        // .operator_voter(operator_voter.pubkey())
        .meta_merkle_root(state_root)
        .epoch(epoch)
        .instruction();

    let tx = Transaction::new_with_payer(&[ix], Some(&payer.pubkey()));
    client
        .process_transaction(tx, &[payer])
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
    chain: u16,
    chain_address: [u8;32],
    sequence: u64,
) -> EllipsisClientResult<Status> {
    let (pool_address, _) =
        relayer_hub_sdk::derive_transaction_account_address(
            &relayer_hub_program_id,
            chain,
            chain_address,
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
) -> EllipsisClientResult<ExtendTransaction> {
    let (pool_address, _) =
        relayer_hub_sdk::derive_ext_transaction_account_address(
            &relayer_hub_program_id,
            sequence
        );

    let pool_account = client
        .get_account(&pool_address)
        .await?;
    let mut pool_account_data = pool_account.data.as_slice();
    let tx = ExtendTransaction::from_bytes(&mut pool_account_data)?;

    Ok(tx)
}

pub async fn do_finalize_transaction(
    client: &EllipsisClient,
    chain: u16,
    chain_address: [u8;32],
    sequence: u64,
    payer: &Keypair,
    finalize: bool,
    state_root:[u8;32]
) -> EllipsisClientResult<Signature> {
    let system_program = solana_program::system_program::id();
    let (hub_config, _) =relayer_hub_sdk::derive_config_account_address(&relayer_hub_program_id);
    let (transaction, _) =relayer_hub_sdk::derive_transaction_account_address(&relayer_hub_program_id, chain, chain_address, sequence);

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

pub async fn do_rollup_transaction(
    client: &EllipsisClient,
    ncn: Pubkey,
    epoch: u64,
    operator_admin: &Keypair,
) -> EllipsisClientResult<Signature> {
    let ncn_config = Config::find_program_address(&relayer_ncn_program::id(), &ncn).0;
    let ballot_box =
        BallotBox::find_program_address(&relayer_ncn_program::id(), &ncn, epoch).0;
    let restaking_program_id = jito_restaking_program::id();
    let (pool, _) =relayer_hub_sdk::derive_final_pool_account_address(&relayer_hub_program_id);

    let (hub_config, _) =relayer_hub_sdk::derive_config_account_address(&relayer_hub_program_id);
    let (transaction, _) =relayer_hub_sdk::derive_final_transaction_address(&relayer_hub_program_id, epoch);

    rollup_transaction(
        client,
        ncn_config,
        ncn,
        ballot_box,
        hub_config,
        pool,
        restaking_program_id,
        epoch,
        operator_admin,
        transaction,
    )
        .await
}

pub async fn rollup_transaction(
    client: &EllipsisClient,
    ncn_config: Pubkey,
    ncn: Pubkey,
    ballot_box: Pubkey,
    hub_config: Pubkey,
    pool: Pubkey,
    restaking_program_id: Pubkey,
    epoch: u64,
    operator_admin: &Keypair,
    transaction: Pubkey,
) -> EllipsisClientResult<Signature> {
    let ix = RollupTransactionBuilder::new()
        .config(ncn_config)
        .ncn(ncn)
        .ballot_box(ballot_box)
        .hub_config(hub_config)
        .pool(pool)
        .relayer_hub_program(relayer_hub_program_id)
        .restaking_program(restaking_program_id)
        .transaction(transaction)
        .epoch(epoch)
        .instruction();

    let tx = Transaction::new_with_payer(&[ix], Some(&operator_admin.pubkey()));
    client
        .process_transaction(tx, &[operator_admin])
        .await
}

pub async fn get_final_tx(
    client: &EllipsisClient,
    epoch: u64,
) -> EllipsisClientResult<FinalTransaction> {
    let (tx_address, _) =
        relayer_hub_sdk::derive_final_transaction_address(
            &relayer_hub_program_id,
            epoch,
        );

    let tx_account = client
        .get_account(&tx_address)
        .await?;
    let mut tx_account_data = tx_account.data.as_slice();
    let tx = FinalTransaction::from_bytes(&mut tx_account_data)?;
    println!("==============tx:{:?}", tx);
    Ok(tx)
}

pub async fn is_reach_consensus(
    client: &EllipsisClient,
    ncn: Pubkey,
    epoch: u64,
) -> EllipsisClientResult<bool> {
    let (address, _, _) =
        BallotBox::find_program_address(&relayer_ncn_program::id(), &ncn, epoch);

    let bx_account = client
        .get_account(&address)
        .await?;
    let account = BallotBox::try_from_slice_unchecked(bx_account.data.as_slice())?;
    Ok(account.is_consensus_reached())
}

pub async fn is_voted(
    client: &EllipsisClient,
    ncn: Pubkey,
    epoch: u64,
    operator: Pubkey,
) -> EllipsisClientResult<bool> {
    let (address, _, _) =
        BallotBox::find_program_address(&relayer_ncn_program::id(), &ncn, epoch);

    let bx_account = client
        .get_account(&address)
        .await?;
    let account = BallotBox::try_from_slice_unchecked(bx_account.data.as_slice())?;
    let operator_votes = account.operator_votes();
    let mut flag = false;
    for operator_vote in operator_votes{
        if *operator_vote.operator() == operator{
            flag = true;
            break;
        }
    }
    Ok(flag)
}