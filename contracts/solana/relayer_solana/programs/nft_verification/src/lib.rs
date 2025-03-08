use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::*;
pub mod state;
pub mod error;
pub mod utils;
pub mod instructions;

declare_id!("3b5KJUApvzf8Pz1DMrkLNpaWkUBvmJK8WQQcWiRSvZb3");

#[program]
pub mod nft_verification {
    use super::*;

    /// Initialize the program with required configurations
    /// @param ctx The context for initialization
    /// @param token_amount_per_nft The amount of tokens to distribute per verified NFT
    pub fn initialize(ctx: Context<Initialize>,
                      token_amount_per_nft: u64,
    ) -> Result<()> {
        instructions::initialize(ctx, token_amount_per_nft)
    }

    /// Sets the approval status for an NFT contract
    /// @param ctx The context for the action
    /// @param nft_contract The Ethereum NFT contract address (20 bytes)
    /// @param status Whether to approve or disapprove the NFT contract
    pub fn set_approved_nft(
        ctx: Context<AdminAction>,
        nft_contract: [u8; 20],
        status: bool,
    ) -> Result<()> {
        instructions::set_approved_nft(ctx, nft_contract, status)
    }

    /// Updates the token amount distributed per verified NFT
    /// @param ctx The context for the action
    /// @param new_token_amount The new token amount to set
    pub fn update_token_amount(
        ctx: Context<AdminAction>,
        new_token_amount: u64,
    ) -> Result<()> {
        instructions::update_token_amount(ctx, new_token_amount)
    }

    /// Processes a Wormhole message containing NFT ownership proof
    /// @param ctx The context for processing the message
    /// @param vaa_hash The VAA hash used to locate the Wormhole message
    pub fn process_wormhole_message(
        ctx: Context<ProcessWormholeMessage>,
        payload: Vec<u8>,
    ) -> Result<()> {
        instructions::process_wormhole_message(ctx, payload)
    }

    /// Allows eligible users to claim tokens for verified NFTs
    /// @param ctx The context for claiming tokens
    pub fn claim_tokens(
        ctx: Context<ClaimTokens>,
    ) -> Result<()> {
        instructions::claim_tokens(ctx)
    }

    /// Allows the admin to withdraw tokens from the vault
    /// @param ctx The context for withdrawing tokens
    /// @param amount The amount of tokens to withdraw
    pub fn withdraw_tokens(
        ctx: Context<WithdrawTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_tokens(ctx, amount)
    }

    /// Updates the admin of the program
    /// @param ctx The context for updating the admin
    /// @param new_admin The public key of the new admin
    pub fn update_admin(
        ctx: Context<AdminAction>,
        new_admin: Pubkey,
    ) -> Result<()> {
        instructions::update_admin(ctx, new_admin)
    }
}