use jito_bytemuck::AccountDeserialize;
use jito_restaking_core::{
    config::Config, ncn_operator_state::NcnOperatorState, ncn_vault_ticket::NcnVaultTicket,
};
use relayer_ncn_client::{
    instructions::{
        *
    },
    // types::ConfigAdminRole,
};
use jito_vault_core::{
    vault_ncn_ticket::VaultNcnTicket, vault_operator_delegation::VaultOperatorDelegation,
};
use solana_program::{
    hash::Hash, instruction::InstructionError, native_token::sol_to_lamports, pubkey::Pubkey,
    system_instruction::transfer,
};
use solana_program_test::{BanksClient, ProgramTestBanksClientExt};
use solana_sdk::{
    commitment_config::CommitmentLevel,
    compute_budget::ComputeBudgetInstruction,
    signature::{Keypair, Signer},
    system_program,
    transaction::{Transaction, TransactionError},
};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account_idempotent,
};
use spl_stake_pool::find_withdraw_authority_program_address;
use super::{restaking_client::NcnRoot,
            // stake_pool_client::PoolRoot
};
use crate::fixtures::{TestError, TestResult};
use relayer_ncn_core::{
    config::Config as NcnConfig,
};
use relayer_ncn_core::constants::MAX_REALLOC_BYTES;
use relayer_ncn_core::vault_registry::VaultRegistry;
use relayer_ncn_core::weight_table::WeightTable;

pub struct RelayerNcnClient {
    banks_client: BanksClient,
    payer: Keypair,
}

impl RelayerNcnClient {
    pub const fn new(banks_client: BanksClient, payer: Keypair) -> Self {
        Self {
            banks_client,
            payer,
        }
    }

    pub async fn process_transaction(&mut self, tx: &Transaction) -> TestResult<()> {
        self.banks_client
            .process_transaction_with_preflight_and_commitment(
                tx.clone(),
                CommitmentLevel::Processed,
            )
            .await?;
        Ok(())
    }

    pub async fn get_best_latest_blockhash(&mut self) -> TestResult<Hash> {
        let blockhash = self.banks_client.get_latest_blockhash().await?;
        let new_blockhash = self
            .banks_client
            .get_new_latest_blockhash(&blockhash)
            .await?;

        Ok(new_blockhash)
    }

    pub async fn airdrop(&mut self, to: &Pubkey, sol: f64) -> TestResult<()> {
        let blockhash = self.banks_client.get_latest_blockhash().await?;
        let new_blockhash = self
            .banks_client
            .get_new_latest_blockhash(&blockhash)
            .await
            .unwrap();
        self.banks_client
            .process_transaction_with_preflight_and_commitment(
                Transaction::new_signed_with_payer(
                    &[transfer(&self.payer.pubkey(), to, sol_to_lamports(sol))],
                    Some(&self.payer.pubkey()),
                    &[&self.payer],
                    new_blockhash,
                ),
                CommitmentLevel::Processed,
            )
            .await?;
        Ok(())
    }

    pub async fn airdrop_lamports(&mut self, to: &Pubkey, lamports: u64) -> TestResult<()> {
        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.banks_client
            .process_transaction_with_preflight_and_commitment(
                Transaction::new_signed_with_payer(
                    &[transfer(&self.payer.pubkey(), to, lamports)],
                    Some(&self.payer.pubkey()),
                    &[&self.payer],
                    blockhash,
                ),
                CommitmentLevel::Processed,
            )
            .await?;
        Ok(())
    }

    pub async fn setup_relayer_ncn(&mut self, ncn_root: &NcnRoot) -> TestResult<()> {
        self.do_initialize_config(ncn_root.ncn_pubkey, &ncn_root.ncn_admin)
            .await?;
        self.do_full_initialize_vault_registry(ncn_root.ncn_pubkey)
            .await?;
        Ok(())
    }

    pub async fn do_initialize_config(
        &mut self,
        ncn: Pubkey,
        ncn_admin: &Keypair,
    ) -> TestResult<()> {
        self.airdrop(&self.payer.pubkey(), 1.0).await?;

        let ncn_admin_pubkey = ncn_admin.pubkey();
        self.initialize_config(
            ncn,
            ncn_admin,
            &ncn_admin_pubkey,
            &ncn_admin_pubkey,
            0,
            0,
            0,
            3,
            10000,
        )
            .await
    }

    pub async fn initialize_config(
        &mut self,
        ncn: Pubkey,
        ncn_admin: &Keypair,
        tie_breaker_admin: &Pubkey,
        fee_wallet: &Pubkey,
        block_engine_fee_bps: u16,
        dao_fee_bps: u16,
        default_ncn_fee_bps: u16,
        epochs_before_stall: u64,
        valid_slots_after_consensus: u64,
    ) -> TestResult<()> {
        let ncn_config = NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn).0;

        let ix = InitializeConfigBuilder::new()
            .config(ncn_config)
            .ncn(ncn)
            .ncn_admin(ncn_admin.pubkey())
            .restaking_program(jito_restaking_program::id())
            .epochs_before_stall(epochs_before_stall)
            .valid_slots_after_consensus(valid_slots_after_consensus)
            .instruction();

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&ncn_admin.pubkey()),
            &[&ncn_admin],
            blockhash,
        ))
            .await
    }

    pub async fn do_full_initialize_vault_registry(&mut self, ncn: Pubkey) -> TestResult<()> {
        self.do_initialize_vault_registry(ncn).await?;
        let num_reallocs = (WeightTable::SIZE as f64 / MAX_REALLOC_BYTES as f64).ceil() as u64 - 1;
        self.do_realloc_vault_registry(ncn, num_reallocs).await?;
        Ok(())
    }

    pub async fn do_initialize_vault_registry(&mut self, ncn: Pubkey) -> TestResult<()> {
        let ncn_config = NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn).0;
        let vault_registry =
            VaultRegistry::find_program_address(&relayer_ncn_program::id(), &ncn).0;

        self.initialize_vault_registry(&ncn_config, &vault_registry, &ncn)
            .await
    }

    pub async fn initialize_vault_registry(
        &mut self,
        ncn_config: &Pubkey,
        vault_registry: &Pubkey,
        ncn: &Pubkey,
    ) -> TestResult<()> {
        let ix = InitializeVaultRegistryBuilder::new()
            .config(*ncn_config)
            .vault_registry(*vault_registry)
            .ncn(*ncn)
            .payer(self.payer.pubkey())
            .system_program(system_program::id())
            .instruction();

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            blockhash,
        ))
            .await
    }
    pub async fn do_realloc_vault_registry(
        &mut self,
        ncn: Pubkey,
        num_reallocations: u64,
    ) -> TestResult<()> {
        let ncn_config = NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn).0;
        let vault_registry =
            VaultRegistry::find_program_address(&relayer_ncn_program::id(), &ncn).0;
        self.realloc_vault_registry(&ncn, &ncn_config, &vault_registry, num_reallocations)
            .await
    }

    pub async fn realloc_vault_registry(
        &mut self,
        ncn: &Pubkey,
        config: &Pubkey,
        vault_registry: &Pubkey,
        num_reallocations: u64,
    ) -> TestResult<()> {
        let ix = ReallocVaultRegistryBuilder::new()
            .ncn(*ncn)
            .payer(self.payer.pubkey())
            .config(*config)
            .vault_registry(*vault_registry)
            .system_program(system_program::id())
            .instruction();

        let ixs = vec![ix; num_reallocations as usize];

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &ixs,
            Some(&self.payer.pubkey()),
            &[&self.payer],
            blockhash,
        ))
            .await
    }
    pub async fn do_admin_register_st_mint(
        &mut self,
        ncn: Pubkey,
        st_mint: Pubkey,
        // ncn_fee_group: NcnFeeGroup,
        reward_multiplier_bps: u64,
        // switchboard_feed: Option<Pubkey>,
        no_feed_weight: Option<u128>,
    ) -> TestResult<()> {
        let vault_registry =
            VaultRegistry::find_program_address(&relayer_ncn_program::id(), &ncn).0;

        let (ncn_config, _, _) =
            NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn);

        let admin = self.payer.pubkey();

        self.admin_register_st_mint(
            ncn,
            ncn_config,
            vault_registry,
            admin,
            st_mint,
            // ncn_fee_group,
            reward_multiplier_bps,
            // switchboard_feed,
            no_feed_weight,
        )
            .await
    }

    pub async fn do_register_vault(
        &mut self,
        ncn: Pubkey,
        vault: Pubkey,
        vault_ncn_ticket: Pubkey,
        ncn_vault_ticket: Pubkey,
    ) -> TestResult<()> {
        let restaking_config_address =
            Config::find_program_address(&jito_restaking_program::id()).0;
        let vault_registry =
            VaultRegistry::find_program_address(&relayer_ncn_program::id(), &ncn).0;

        self.register_vault(
            restaking_config_address,
            vault_registry,
            ncn,
            vault,
            vault_ncn_ticket,
            ncn_vault_ticket,
        )
            .await
    }

    pub async fn register_vault(
        &mut self,
        restaking_config: Pubkey,
        vault_registry: Pubkey,
        ncn: Pubkey,
        vault: Pubkey,
        vault_ncn_ticket: Pubkey,
        ncn_vault_ticket: Pubkey,
    ) -> TestResult<()> {
        let ix = RegisterVaultBuilder::new()
            .restaking_config(restaking_config)
            .vault_registry(vault_registry)
            .ncn(ncn)
            .vault(vault)
            .vault_ncn_ticket(vault_ncn_ticket)
            .ncn_vault_ticket(ncn_vault_ticket)
            .restaking_program_id(jito_restaking_program::id())
            .vault_program_id(jito_vault_program::id())
            .instruction();

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            blockhash,
        ))
            .await
    }

    pub async fn admin_register_st_mint(
        &mut self,
        ncn: Pubkey,
        ncn_config: Pubkey,
        vault_registry: Pubkey,
        admin: Pubkey,
        st_mint: Pubkey,
        // ncn_fee_group: NcnFeeGroup,
        reward_multiplier_bps: u64,
        // switchboard_feed: Option<Pubkey>,
        no_feed_weight: Option<u128>,
    ) -> TestResult<()> {
        let ix = {
            let mut builder = AdminRegisterStMintBuilder::new();
            builder
                .config(ncn_config)
                .ncn(ncn)
                .vault_registry(vault_registry)
                .admin(admin)
                .restaking_program(jito_restaking_program::id())
                .st_mint(st_mint)
                // .ncn_fee_group(ncn_fee_group.group)
                .reward_multiplier_bps(reward_multiplier_bps);

            // if let Some(switchboard_feed) = switchboard_feed {
            //     builder.switchboard_feed(switchboard_feed);
            // }

            if let Some(no_feed_weight) = no_feed_weight {
                builder.no_feed_weight(no_feed_weight);
            }

            builder.instruction()
        };

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            blockhash,
        ))
            .await
    }
}