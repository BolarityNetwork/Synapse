use std::{
    str::FromStr,
    time::{Duration, Instant},
};

use anyhow::Result;
use ellipsis_client::EllipsisClient;
use log::info;
use solana_metrics::{datapoint_error, datapoint_info};
use solana_rpc_client::rpc_client::RpcClient;
use solana_sdk::{pubkey::Pubkey, signer::keypair::Keypair};
use relayer_hub_client::types::Status;
use crate::{
    relayer_ncn::{cast_vote,get_all_can_finalize_tx,get_ncn_config, get_tx_status},
    Cli,
};
use crate::relayer_ncn::{do_finalize_transaction, get_tx};
use merkle_tree::merkle_tree::MerkleTree;

pub async fn wait_for_next_epoch(rpc_client: &RpcClient) -> Result<()> {
    let current_epoch = rpc_client.get_epoch_info()?.epoch;

    loop {
        tokio::time::sleep(Duration::from_secs(10)).await; // Check every 10 seconds
        let new_epoch = rpc_client.get_epoch_info()?.epoch;

        if new_epoch > current_epoch {
            info!("New epoch detected: {} -> {}", current_epoch, new_epoch);
            return Ok(());
        }
    }
}

pub async fn get_previous_epoch_last_slot(rpc_client: &RpcClient) -> Result<u64> {
    let epoch_info = rpc_client.get_epoch_info()?;

    let previous_epoch = epoch_info.epoch.saturating_sub(1);

    Ok(previous_epoch)
}

#[allow(clippy::too_many_arguments)]
pub async fn process_epoch(
    client: &EllipsisClient,
    previous_epoch: u64,
    payer: &Keypair,
    ncn_address: &Pubkey,
    cli_args: &Cli,
) -> Result<()> {
    info!("Processing epoch {:?}", previous_epoch);
    let start = Instant::now();
    let operator = Pubkey::from_str(&cli_args.operator_address).unwrap();

    let mut sequences = vec![];
    // Find transactions that are in the Executed or Failing state in a certain epoch.
    let state_root = if let Ok((begin_sequence, current_sequence))= get_all_can_finalize_tx(client, previous_epoch).await {
        for i in begin_sequence..=current_sequence {
            let old_status = get_tx_status(client, i).await?;
            if old_status == Status::Executed || old_status == Status::Failing {
                sequences.push(i);
            }
        }
        let byte_vecs: Vec<Vec<u8>> = sequences
            .iter()
            .map(|&num| {
                num.to_le_bytes().to_vec()
            })
            .collect();
        let mt = MerkleTree::new(&byte_vecs, false);
        let state_root = mt.get_root().unwrap().to_bytes();
        for sequence in sequences{
            do_finalize_transaction(client, sequence, payer, true, state_root)
                .await?;
            let status = get_tx_status(client, sequence).await?;
            assert_eq!(status, Status::Finality);
            let root = get_tx(client, sequence).await?;
            assert_eq!(root.state_root, state_root);
        }
        state_root
    } else {
        [0u8;32]
    };

    // Cast vote using the generated merkle root
    let tx_sig = match cast_vote(
        client,
        payer,
        *ncn_address,
        operator,
        payer,
        state_root,
        previous_epoch,
    )
        .await
    {
        Ok(sig) => {
            datapoint_info!(
                "relayer-operator_cli-vote_cast_success",
                ("epoch", previous_epoch, i64),
                ("tx_sig", format!("{:?}", sig), String)
            );
            sig
        }
        Err(e) => {
            datapoint_error!(
                "relayer-operator_cli-vote_cast_error",
                ("epoch", previous_epoch, i64),
                ("error", format!("{:?}", e), String)
            );
            return Err(anyhow::anyhow!("Failed to cast vote: {}", e)); // Convert the error
        }
    };
    info!("Successfully cast vote at tx {:?}", tx_sig);

    let elapsed_us = start.elapsed().as_micros();
    // Emit a datapoint for starting the epoch processing
    datapoint_info!(
        "relayer-operator_cli-process_epoch",
        ("epoch", previous_epoch, i64),
        ("elapsed_us", elapsed_us, i64),
    );
    solana_metrics::flush();

    Ok(())
}
