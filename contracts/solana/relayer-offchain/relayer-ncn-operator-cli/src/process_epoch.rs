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
use crate::relayer_ncn::{do_finalize_transaction, do_rollup_transaction, get_final_tx, get_tx, is_reach_consensus, is_voted};
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
    // Determine whether you have voted in this epoch.
    let is_voted = is_voted(client, *ncn_address, previous_epoch, operator).await?;
    if is_voted {
        info!("You have already voted at epoch:{}", previous_epoch);
        return Ok(());
    }
    // let final_tx = get_final_tx(client, previous_epoch).await?;
    // // already reach consensus
    // if final_tx.epoch == previous_epoch {
    //     info!("already reach consensus at epoch:{}", previous_epoch);
    //     return Ok(());
    // }
    let mut sequences = vec![];
    // Find transactions that are in the Executed or Failing state in a certain epoch.
    let mut state_root = [0u8;32];
    let mut hashs = vec![];
    if let Ok((begin_sequence, current_sequence))= get_all_can_finalize_tx(client, previous_epoch).await {
        for i in begin_sequence..=current_sequence {
            let tx = get_tx(client, i).await?;
            // if tx.status == Status::Executed || tx.status == Status::Failing {
                sequences.push(i);
                hashs.push(tx.hash);
            // }
        }
        let byte_vecs: Vec<Vec<u8>> = hashs
            .iter()
            .map(|&num| {
                num.to_vec()
            })
            .collect();
        if byte_vecs.len() > 0 {
            let mt = MerkleTree::new(&byte_vecs, false);
            let root = mt.get_root().unwrap().to_bytes();
            for sequence in sequences{
                do_finalize_transaction(client, sequence, payer, true, state_root)
                    .await?;
                // let status = get_tx_status(client, sequence).await?;
                // assert_eq!(status, Status::Finality);
                // let root = get_tx(client, sequence).await?;
                // assert_eq!(root.state_root, state_root);
            }
            state_root = root;
        }
    }
    // do nothing
    if state_root == [0u8;32] {
        info!("nothing to generate merkel tree");
        return Ok(());
    }
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
    let consensus = is_reach_consensus(
        client,
        *ncn_address,
        previous_epoch
    ).await?;
    if consensus {
        let tx_sig = match do_rollup_transaction(
            client,
            *ncn_address,
            previous_epoch,
            payer,
        ).await
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
                "relayer-operator_cli-rollup_transaction_error",
                ("epoch", previous_epoch, i64),
                ("error", format!("{:?}", e), String)
            );
                return Err(anyhow::anyhow!("Failed to rollup transaction: {}", e)); // Convert the error
            }
        };
        info!("Successfully rollup transaction at tx {:?}", tx_sig);
        get_final_tx(client, previous_epoch).await?;
    }
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
