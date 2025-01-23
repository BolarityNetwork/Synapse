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

use crate::{
    // get_meta_merkle_root,
    // tip_router::{cast_vote, get_ncn_config},
    Cli,
};

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
    cli_args: &Cli,
) -> Result<()> {
    info!("Processing epoch {:?}", previous_epoch);

    solana_metrics::flush();

    Ok(())
}
