use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::*;
use crate::utils::*;


/// Initialize the program with required configurations
/// @param ctx The context for initialization
/// @param token_amount_per_nft The amount of tokens to distribute per verified NFT
pub fn initialize(ctx: Context<Initialize>,
                  token_amount_per_nft: u64,
) -> Result<()> {
    let state = &mut ctx.accounts.state;

    state.admin = ctx.accounts.admin.key();
    state.token_mint = ctx.accounts.token_mint.key();
    state.token_vault = ctx.accounts.token_vault.key();
    state.token_amount_per_nft = token_amount_per_nft;
    state.bump = ctx.bumps.state;

    msg!("Program initialized successfully");
    msg!("admin:{}, token_mint:{}, token_amount_per_nft:{}",
            state.admin,
            state.token_mint,
            token_amount_per_nft);
    emit!(ProgramInitialized {
            admin: state.admin,
            token_mint: state.token_mint,
            token_amount_per_nft,
        });
    Ok(())
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
    let state = &mut ctx.accounts.state;

    // Ensure only admin can update approved NFTs
    require_keys_eq!(
            ctx.accounts.admin.key(),
            state.admin,
            NftVerificationError::Unauthorized
        );

    // Convert Ethereum address to Pubkey for storage
    let eth_address = ethereum_address_to_pubkey(&nft_contract);

    // Check if the status is actually changing to avoid unnecessary processing
    let current_status = state.is_approved_nft(&eth_address);
    if current_status == status {
        return Ok(()); // No change needed
    }

    // Update the approved NFT status
    state.set_approved_nft(eth_address, status)?;

    msg!("NFT contract approval status updated: {:?} => {}", nft_contract, status);
    emit!(ApprovedNftUpdated {
            nft_contract: eth_address,
            status,
        });
    Ok(())
}

/// Updates the token amount distributed per verified NFT
/// @param ctx The context for the action
/// @param new_token_amount The new token amount to set
pub fn update_token_amount(
    ctx: Context<AdminAction>,
    new_token_amount: u64,
) -> Result<()> {
    let state = &mut ctx.accounts.state;

    // Ensure only admin can update token amount
    require_keys_eq!(
            ctx.accounts.admin.key(),
            state.admin,
            NftVerificationError::Unauthorized
        );

    let old_amount = state.token_amount_per_nft;
    state.token_amount_per_nft = new_token_amount;

    msg!("Token amount updated: {} => {}", old_amount, new_token_amount);
    emit!(TokenAmountUpdated {
            old_amount,
            new_amount: new_token_amount,
        });

    Ok(())
}

pub fn create_proof_record(
    ctx: Context<CreateProofRecord>,
    payload: Vec<u8>,
) -> Result<()> {
    let state = &ctx.accounts.state;
    let proof_account = &mut ctx.accounts.proof_record;

    let proxy_account_bytes: [u8; 20] = payload[..20].try_into().map_err(|_| NftVerificationError::InvalidPayload)?;
    let nft_contract_bytes: [u8; 20] = payload[20..40].try_into().map_err(|_| NftVerificationError::InvalidPayload)?;
    let nft_contract = ethereum_address_to_pubkey(&nft_contract_bytes);
    let relayer_contract_bytes: [u8; 32] = payload[80..112].try_into().map_err(|_| NftVerificationError::InvalidPayload)?;
    let chain_id_bytes: [u8; 2] = payload[112..114].try_into().map_err(|_| NftVerificationError::InvalidPayload)?;

    let chain_id = u16::from_le_bytes(chain_id_bytes.try_into().map_err(|_| NftVerificationError::InvalidPayload)?);
    let proxy_account = ethereum_address_fill_pubkey(&proxy_account_bytes);
    let relayer_contract = Pubkey::new(&relayer_contract_bytes);
    // 3. Validate that the NFT contract is in the approved list
    require!(
            state.is_approved_nft(&nft_contract),
            NftVerificationError::UnapprovedNftContract
        );
    proof_account.relayer_account = relayer_contract;
    proof_account.chain_id = chain_id;
    proof_account.proxy_account = proxy_account;
    Ok(())
}

/// Processes a Wormhole message containing NFT ownership proof
/// @param ctx The context for processing the message
/// @param vaa_hash The VAA hash used to locate the Wormhole message
pub fn process_wormhole_message(
    ctx: Context<ProcessWormholeMessage>,
    payload: Vec<u8>,
) -> Result<()> {

    // let state = &ctx.accounts.state;
    // let wormhole_message = &ctx.accounts.wormhole_message;
    //
    // // 1. Verify the VAA comes from the expected emitter (Ethereum contract)
    // require_keys_eq!(
    //         wormhole_message.emitter_address,
    //         state.wormhole_emitter,
    //         NftVerificationError::InvalidEmitter
    //     );
    //
    // // 2. Parse the payload from the Wormhole message
    // // Format from Ethereum: [proxy_account (20 bytes)][nft_contract (20 bytes)][token_id (32 bytes)][solana_receiver (32 bytes)]
    // let payload = wormhole_message.payload.as_ref();
    require!(
            payload.len() >= 80, // 20 + 20 + 8 + 32
            NftVerificationError::InvalidPayload
        );

    // Extract data from payload
    let proxy_account_bytes: [u8; 20] = payload[..20].try_into().map_err(|_| NftVerificationError::InvalidPayload)?;
    let nft_contract_bytes: [u8; 20] = payload[20..40].try_into().map_err(|_| NftVerificationError::InvalidPayload)?;
    let token_id_bytes: [u8; 8] = payload[40..48].try_into().map_err(|_| NftVerificationError::InvalidPayload)?;
    let solana_receiver_bytes: [u8; 32] = payload[48..80].try_into().map_err(|_| NftVerificationError::InvalidPayload)?;

    // Convert to Solana types
    let proxy_account = ethereum_address_to_pubkey(&proxy_account_bytes);
    let nft_contract = ethereum_address_to_pubkey(&nft_contract_bytes);

    // Convert token_id from big-endian bytes to u64
    let token_id = u64::from_be_bytes(token_id_bytes.try_into().map_err(|_| NftVerificationError::InvalidPayload)?);

    let solana_receiver = Pubkey::new(&solana_receiver_bytes);

    // // 3. Validate that the NFT contract is in the approved list
    // require!(
    //         state.is_approved_nft(&nft_contract),
    //         NftVerificationError::UnapprovedNftContract
    //     );

    // 4. Store the proof in a new account
    let proof_account = &mut ctx.accounts.proof_record;

    require!(
            !proof_account.initialized,
            NftVerificationError::ProofAlreadyRecorded
        );

    proof_account.proxy_account = proxy_account;
    proof_account.nft_contract = nft_contract;
    proof_account.token_id = token_id;
    proof_account.solana_receiver = solana_receiver;
    proof_account.claimed = false;
    proof_account.initialized = true;
    proof_account.timestamp = Clock::get()?.unix_timestamp;

    msg!("Proof recorded: NFT contract {:?}, Token ID {}", nft_contract_bytes, token_id);
    emit!(ProofRecorded {
            proxy_account,
            nft_contract,
            token_id,
            solana_receiver,
            sequence: 0,
        });

    Ok(())
}

/// Allows eligible users to claim tokens for verified NFTs
/// @param ctx The context for claiming tokens
pub fn claim_tokens(
    ctx: Context<ClaimTokens>,
) -> Result<()> {
    let state = &ctx.accounts.state;
    let proof_record = &mut ctx.accounts.proof_record;

    // Ensure the proof has been recorded but not yet claimed
    require!(
            proof_record.initialized,
            NftVerificationError::ProofNotFound
        );

    require!(
            !proof_record.claimed,
            NftVerificationError::AlreadyClaimed
        );

    // Ensure the caller is the intended receiver
    require_keys_eq!(
            ctx.accounts.receiver.key(),
            proof_record.solana_receiver,
            NftVerificationError::InvalidReceiver
        );

    // Ensure the receiver's token account is for the correct mint
    require_keys_eq!(
            ctx.accounts.receiver_token_account.mint,
            state.token_mint,
            NftVerificationError::InvalidTokenAccount
        );

    // Transfer the tokens from vault to receiver
    let transfer_amount = state.token_amount_per_nft;

    let seeds = &[
        b"state".as_ref(),
        &[state.bump],
    ];
    let signer = &[&seeds[..]];

    // Transfer tokens
    let cpi_accounts = Transfer {
        from: ctx.accounts.token_vault.to_account_info(),
        to: ctx.accounts.receiver_token_account.to_account_info(),
        authority: ctx.accounts.state.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(cpi_ctx, transfer_amount)?;

    // Mark the proof as claimed and record the claim timestamp
    proof_record.claimed = true;
    proof_record.claim_timestamp = Clock::get()?.unix_timestamp;

    msg!("Tokens claimed: {} tokens for NFT ID {}", transfer_amount, proof_record.token_id);
    emit!(TokensClaimed {
            receiver: proof_record.solana_receiver,
            nft_contract: proof_record.nft_contract,
            token_id: proof_record.token_id,
            amount: transfer_amount,
            timestamp: proof_record.claim_timestamp,
        });

    Ok(())
}

/// Allows the admin to withdraw tokens from the vault
/// @param ctx The context for withdrawing tokens
/// @param amount The amount of tokens to withdraw
pub fn withdraw_tokens(
    ctx: Context<WithdrawTokens>,
    amount: u64,
) -> Result<()> {
    let state = &ctx.accounts.state;

    // Ensure only admin can withdraw tokens
    require_keys_eq!(
            ctx.accounts.admin.key(),
            state.admin,
            NftVerificationError::Unauthorized
        );

    // Ensure the admin's token account is for the correct mint
    require_keys_eq!(
            ctx.accounts.admin_token_account.mint,
            state.token_mint,
            NftVerificationError::InvalidTokenAccount
        );

    // Check that the vault has enough tokens
    require!(
            ctx.accounts.token_vault.amount >= amount,
            NftVerificationError::InsufficientFunds
        );

    // Transfer the tokens from vault to admin
    let seeds = &[
        b"state".as_ref(),
        &[state.bump],
    ];
    let signer = &[&seeds[..]];

    // Transfer tokens
    let cpi_accounts = Transfer {
        from: ctx.accounts.token_vault.to_account_info(),
        to: ctx.accounts.admin_token_account.to_account_info(),
        authority: ctx.accounts.state.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(cpi_ctx, amount)?;

    msg!("Tokens withdrawn: {} tokens to admin", amount);
    emit!(TokensWithdrawn {
            receiver: ctx.accounts.admin.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

    Ok(())
}

/// Updates the admin of the program
/// @param ctx The context for updating the admin
/// @param new_admin The public key of the new admin
pub fn update_admin(
    ctx: Context<AdminAction>,
    new_admin: Pubkey,
) -> Result<()> {
    let state = &mut ctx.accounts.state;

    // Ensure only current admin can update admin
    require_keys_eq!(
            ctx.accounts.admin.key(),
            state.admin,
            NftVerificationError::Unauthorized
        );

    require!(
            new_admin != Pubkey::default(),
            NftVerificationError::InvalidAdminAddress
        );

    let old_admin = state.admin;
    state.admin = new_admin;

    msg!("Admin updated: {} => {}", old_admin, new_admin);
    emit!(AdminUpdated {
            old_admin,
            new_admin,
        });

    Ok(())
}