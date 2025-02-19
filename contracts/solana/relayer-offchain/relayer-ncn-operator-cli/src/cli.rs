use std::path::PathBuf;

use clap::Parser;
use solana_sdk::pubkey::Pubkey;

#[derive(Parser)]
#[command(author, version, about)]
pub struct Cli {
    #[arg(short, long)]
    pub keypair_path: String,

    #[arg(short, long)]
    pub operator_address: String,

    #[arg(short, long, default_value = "http://localhost:8899")]
    pub rpc_url: String,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(clap::Subcommand)]
pub enum Commands {
    Run {
        #[arg(short, long)]
        ncn_address: Pubkey,
    },
}
