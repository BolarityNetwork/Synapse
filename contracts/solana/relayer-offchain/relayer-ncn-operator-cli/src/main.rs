mod cli;

use {
    anyhow::Result,
    clap::Parser,
    ellipsis_client::EllipsisClient,
    log::{error, info},
    solana_rpc_client::rpc_client::RpcClient,
    solana_sdk::signer::keypair::read_keypair_file,
    relayer_ncn_operator_cli::{
        cli::{Cli, Commands},
        process_epoch::{get_previous_epoch_last_slot, process_epoch, wait_for_next_epoch},
    },
};

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();
    let cli = Cli::parse();
    let keypair = read_keypair_file(&cli.keypair_path).expect("Failed to read keypair file");
    let rpc_client = EllipsisClient::from_rpc(
        RpcClient::new(cli.rpc_url.clone()),
        &read_keypair_file(&cli.keypair_path).expect("Failed to read keypair file"),
    )?;

    match &cli.command {
        Commands::Run {
            ncn_address,
        } => {
            info!("Running Relayer NCN Operator client...");

            loop {
                // Get the last slot of the previous epoch
                let previous_epoch =
                    get_previous_epoch_last_slot(&rpc_client).await?;
                info!("Processing previous epoch:{}", previous_epoch);

                // Process the epoch
                match process_epoch(
                    &rpc_client,
                    previous_epoch,
                    &keypair,
                    ncn_address,
                    &cli,
                )
                    .await
                {
                    Ok(_) => info!("Successfully processed epoch"),
                    Err(e) => {
                        error!("Error processing epoch: {}", e);
                        // Continue to next epoch even if this one failed
                    }
                }

                // Wait for epoch change
                wait_for_next_epoch(&rpc_client).await?;
            }
        }
    }
}
