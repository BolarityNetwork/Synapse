use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::error::*;

#[account]
pub struct StateAccount {
    /// The administrator of the program
    pub admin: Pubkey,

    /// The mint address of the token to be distributed
    pub token_mint: Pubkey,

    /// The token vault that holds the tokens to be distributed
    pub token_vault: Pubkey,

    /// The amount of tokens to distribute per verified NFT
    pub token_amount_per_nft: u64,
    /// List of approved NFT contracts
    pub approved_nfts: Vec<Pubkey>,

    /// PDA bump seed
    pub bump: u8,

    /// Program initialization timestamp
    pub init_timestamp: i64,

    /// Reserved space for future upgrades
    pub reserved: [u8; 64],
}

impl StateAccount{
    pub const LEN: usize = 32 + // admin
        32 + // token_mint
        32 + // token_vault
        8 +  // token_amount_per_nft
        4 + (32 * 20) + // approved_nfts (vector with capacity for 20 NFTs)
        1 +  // bump
        8 +  // init_timestamp
        64;  // reserved
    /// Adds or removes an NFT contract from the approved list
    pub fn set_approved_nft(&mut self, nft_contract: Pubkey, status: bool) -> anchor_lang::Result<()> {
        if status {
            // Add to approved list if not already present
            if !self.approved_nfts.contains(&nft_contract) {
                self.approved_nfts.push(nft_contract);
            }
        } else {
            // Remove from approved list
            self.approved_nfts.retain(|&x| x != nft_contract);
        }
        Ok(())
    }

    /// Checks if an NFT contract is in the approved list
    pub fn is_approved_nft(&self, nft_contract: &Pubkey) -> bool {
        self.approved_nfts.contains(nft_contract)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info>  {
    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        constraint = token_vault.mint == token_mint.key() @ NftVerificationError::InvalidTokenAccount,
        constraint = token_vault.owner == state.key() @ NftVerificationError::InvalidVaultOwner,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    // /// The Ethereum relay contract address (used to verify message source)
    // /// @dev This is the address of the NFTProofRelay contract on Ethereum
    // pub eth_relay_address: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + StateAccount::LEN,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, StateAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub state: Account<'info, StateAccount>,
}

#[derive(Accounts)]
#[instruction(payload: Vec<u8>)]
pub struct ProcessWormholeMessage<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub state: Account<'info, StateAccount>,

    #[account(
        init,
        payer = payer,
        space = 8 + ProofRecord::LEN,
        seeds = [
            b"proof",
            &payload[20..40],  // NFT contract address
            &payload[64..72],  // Token ID
        ],
        bump
    )]
    pub proof_record: Account<'info, ProofRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub receiver: Signer<'info>,

    pub state: Account<'info, StateAccount>,

    #[account(
        mut,
        constraint = token_vault.mint == state.token_mint @ NftVerificationError::InvalidTokenAccount,
        constraint = token_vault.owner == state.key() @ NftVerificationError::InvalidVaultOwner,
        constraint = token_vault.amount >= state.token_amount_per_nft @ NftVerificationError::InsufficientFunds,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = receiver_token_account.owner == receiver.key() @ NftVerificationError::InvalidTokenAccount,
        constraint = receiver_token_account.mint == state.token_mint @ NftVerificationError::InvalidTokenAccount,
    )]
    pub receiver_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            b"proof",
            &proof_record.nft_contract.as_ref()[0..20],
            &proof_record.token_id.to_be_bytes(),
        ],
        bump,
        constraint = proof_record.initialized @ NftVerificationError::ProofNotFound,
        constraint = !proof_record.claimed @ NftVerificationError::AlreadyClaimed,
        constraint = proof_record.solana_receiver == receiver.key() @ NftVerificationError::InvalidReceiver,
    )]
    pub proof_record: Account<'info, ProofRecord>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawTokens<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        constraint = state.admin == admin.key() @ NftVerificationError::Unauthorized,
    )]
    pub state: Account<'info, StateAccount>,

    #[account(
        mut,
        constraint = token_vault.mint == state.token_mint @ NftVerificationError::InvalidTokenAccount,
        constraint = token_vault.owner == state.key() @ NftVerificationError::InvalidVaultOwner,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = admin_token_account.owner == admin.key() @ NftVerificationError::InvalidTokenAccount,
        constraint = admin_token_account.mint == state.token_mint @ NftVerificationError::InvalidTokenAccount,
    )]
    pub admin_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct ProofRecord {
    /// The Ethereum proxy account that owns the NFT
    pub proxy_account: Pubkey,

    /// The Ethereum NFT contract address
    pub nft_contract: Pubkey,

    /// The NFT token ID
    pub token_id: u64,

    /// The Solana account that will receive tokens
    pub solana_receiver: Pubkey,

    /// Whether the tokens have been claimed
    pub claimed: bool,

    /// Whether this proof record has been initialized
    pub initialized: bool,

    /// The timestamp when the proof was recorded
    pub timestamp: i64,

    /// The timestamp when the tokens were claimed (0 if not claimed)
    pub claim_timestamp: i64,

    /// Reserved space for future upgrades
    pub reserved: [u8; 32],
}

impl ProofRecord {
    pub const LEN: usize = 32 + // proxy_account
        32 + // nft_contract
        8 +  // token_id
        32 + // solana_receiver
        1 +  // claimed
        1 +  // initialized
        8 +  // timestamp
        8 +  // claim_timestamp
        32;  // reserved
}
#[event]
pub struct ProgramInitialized {
    pub admin: Pubkey,
    pub token_mint: Pubkey,
    pub token_amount_per_nft: u64,
}

#[event]
pub struct ApprovedNftUpdated {
    pub nft_contract: Pubkey,
    pub status: bool,
}

#[event]
pub struct TokenAmountUpdated {
    pub old_amount: u64,
    pub new_amount: u64,
}

#[event]
pub struct ProofRecorded {
    pub proxy_account: Pubkey,
    pub nft_contract: Pubkey,
    pub token_id: u64,
    pub solana_receiver: Pubkey,
    pub sequence: u64,
}

#[event]
pub struct TokensClaimed {
    pub receiver: Pubkey,
    pub nft_contract: Pubkey,
    pub token_id: u64,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensWithdrawn {
    pub receiver: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AdminUpdated {
    pub old_admin: Pubkey,
    pub new_admin: Pubkey,
}