use anchor_lang::AccountDeserialize;
use solana_program::{pubkey::Pubkey, system_instruction::transfer};
use solana_program_test::{BanksClient, ProgramTestBanksClientExt};
use solana_sdk::{
    commitment_config::CommitmentLevel,
    native_token::{sol_to_lamports, LAMPORTS_PER_SOL},
    signature::{Keypair, Signer},
    transaction::Transaction,
    vote::{
        instruction::CreateVoteAccountConfig,
        state::{VoteInit, VoteStateVersions},
    },
};
use relayer_hub_client::instructions::{ExecuteTransactionBuilder, FinalizeTransactionBuilder, InitTransactionBuilder, InitializeBuilder, RegisterRelayerBuilder, RegisterTxPoolBuilder, RollupTransactionBuilder};
use crate::fixtures::TestResult;
use relayer_hub_client::programs::RELAYER_HUB_ID as relayer_hub_program;
use relayer_hub_client::accounts::{EpochSequence, FinalTransaction, FinalTransactionPool, TransactionPool};
use relayer_hub_client::accounts::Transaction as HubTransaction;
use relayer_hub_client::types::Status;
use relayer_hub_sdk::relayer_hub;

pub struct RelayerHubClient {
    banks_client: BanksClient,
    payer: Keypair,
}

impl RelayerHubClient {
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

    pub async fn do_initialize(&mut self, authority: Pubkey) -> TestResult<()> {
        let (config, _) =
            relayer_hub_sdk::derive_config_account_address(&relayer_hub_program);
        let (relayer_info, _) =relayer_hub_sdk::derive_relayer_info_account_address(&relayer_hub_program);
        let system_program = solana_program::system_program::id();
        let payer = self.payer.pubkey();
        self.initialize(
            authority,
            relayer_info,
            config,
            system_program,
            payer,
        )
            .await
    }

    pub async fn initialize(
        &mut self,
        authority: Pubkey,
        relayer_info: Pubkey,
        config: Pubkey,
        system_program: Pubkey,
        payer: Pubkey,
    ) -> TestResult<()> {
        let ix = InitializeBuilder::new()
            .config(config)
            .relayer_info(relayer_info)
            .payer(payer)
            .system_program(system_program)
            .authority(authority)
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

    pub async fn do_register_tx_pool(&mut self) -> TestResult<()> {
        let (config, _) =
            relayer_hub_sdk::derive_config_account_address(&relayer_hub_program);
        let (pool, _) =
            relayer_hub_sdk::derive_pool_account_address(&relayer_hub_program);
        let (final_pool, _) =
            relayer_hub_sdk::derive_final_pool_account_address(&relayer_hub_program);
        let system_program = solana_program::system_program::id();

        self.register_tx_pool(
            config,
            pool,
            final_pool,
            system_program,
        )
            .await
    }

    pub async fn register_tx_pool(
        &mut self,
        config: Pubkey,
        pool: Pubkey,
        final_pool: Pubkey,
        system_program: Pubkey,
    ) -> TestResult<()> {
        let ix = RegisterTxPoolBuilder::new()
            .config(config)
            .pool(pool)
            .final_pool(final_pool)
            .owner(self.payer.pubkey())
            .system_program(system_program)
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

    pub async fn do_register_relayer(&mut self,
                                     relayer_keypair: &Keypair,) -> TestResult<()> {
        let (config, _) =
            relayer_hub_sdk::derive_config_account_address(&relayer_hub_program);
        let (relayer_info, _) =relayer_hub_sdk::derive_relayer_info_account_address(&relayer_hub_program);
        let system_program = solana_program::system_program::id();
        let (relayer, _) =relayer_hub_sdk::derive_relayer_account_address(&relayer_hub_program, &relayer_keypair.pubkey());

        self.register_relayer(
            relayer,
            relayer_info,
            config,
            system_program,
            relayer_keypair,
        )
            .await
    }

    pub async fn register_relayer(
        &mut self,
        relayer: Pubkey,
        relayer_info: Pubkey,
        config: Pubkey,
        system_program: Pubkey,
        relayer_keypair: &Keypair,
    ) -> TestResult<()> {
        let ix = RegisterRelayerBuilder::new()
            .config(config)
            .relayer_info(relayer_info)
            .payer(relayer_keypair.pubkey())
            .relayer(relayer)
            .system_program(system_program)
            .instruction();

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&relayer_keypair.pubkey()),
            &[&relayer_keypair],
            blockhash,
        ))
            .await
    }

    pub async fn get_pool_sequence(
        &mut self,
    ) -> TestResult<u64> {
        let (pool_address, _) =
            relayer_hub_sdk::derive_pool_account_address(
                &relayer_hub_program,
            );

        let pool_account = self
            .banks_client
            .get_account(pool_address)
            .await?
            .unwrap();
        let mut pool_account_data = pool_account.data.as_slice();
        let pool = TransactionPool::from_bytes(&mut pool_account_data)?;

        Ok(pool.total)
    }

    pub async fn do_init_transaction(
        &mut self,
        sequence: u64,
        payer: &Keypair,
        data: Vec<u8>,
        epoch: u64,
    ) -> TestResult<()> {
        let (relayer_info, _) =relayer_hub_sdk::derive_relayer_info_account_address(&relayer_hub_program);
        let (pool, _) =relayer_hub_sdk::derive_pool_account_address(&relayer_hub_program);
        let system_program = solana_program::system_program::id();
        let (hub_config, _) =relayer_hub_sdk::derive_config_account_address(&relayer_hub_program);
        let (transaction, _) =relayer_hub_sdk::derive_transaction_account_address(&relayer_hub_program, sequence);
        let (epoch_sequence, _) =relayer_hub_sdk::derive_epoch_sequence_address(&relayer_hub_program, epoch);
        let (final_transaction, _) =relayer_hub_sdk::derive_final_transaction_address(&relayer_hub_program, epoch);
        self.init_transaction(
            hub_config,
            relayer_info,
            pool,
            transaction,
            system_program,
            sequence,
            payer,
            data,
            epoch_sequence,
            epoch,
            final_transaction,
        )
            .await
    }

    pub async fn init_transaction(
        &mut self,
        hub_config: Pubkey,
        relayer_info: Pubkey,
        pool: Pubkey,
        transaction: Pubkey,
        system_program: Pubkey,
        sequence: u64,
        payer: &Keypair,
        data: Vec<u8>,
        epoch_sequence:Pubkey,
        epoch: u64,
        final_transaction: Pubkey,
    ) -> TestResult<()> {
        let ix = InitTransactionBuilder::new()
            .config(hub_config)
            .pool(pool)
            .relayer(payer.pubkey())
            .relayer_info(relayer_info)
            .transaction(transaction)
            .epoch_sequence(epoch_sequence)
            .system_program(system_program)
            .final_transaction(final_transaction)
            .sequence(sequence)
            .data(data)
            .epoch(epoch)
            .instruction();

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
            .await
    }

    pub async fn get_pool_count(
        &mut self,
    ) -> TestResult<u64> {
        let (pool_address, _) =
            relayer_hub_sdk::derive_pool_account_address(
                &relayer_hub_program,
            );

        let pool_account = self
            .banks_client
            .get_account(pool_address)
            .await?
            .unwrap();
        let mut pool_account_data = pool_account.data.as_slice();
        let pool = TransactionPool::from_bytes(&mut pool_account_data)?;

        Ok(pool.total)
    }

    pub async fn do_execute_transaction(
        &mut self,
        sequence: u64,
        payer: &Keypair,
        success: bool,
        hash: [u8;64],
    ) -> TestResult<()> {
        let (relayer_info, _) =relayer_hub_sdk::derive_relayer_info_account_address(&relayer_hub_program);
        let system_program = solana_program::system_program::id();
        let (hub_config, _) =relayer_hub_sdk::derive_config_account_address(&relayer_hub_program);
        let (transaction, _) =relayer_hub_sdk::derive_transaction_account_address(&relayer_hub_program, sequence);
        self.execute_transaction(
            hub_config,
            relayer_info,
            transaction,
            system_program,
            sequence,
            payer,
            success,
            hash,
        )
            .await
    }

    pub async fn execute_transaction(
        &mut self,
        hub_config: Pubkey,
        relayer_info: Pubkey,
        transaction: Pubkey,
        system_program: Pubkey,
        sequence: u64,
        payer: &Keypair,
        success: bool,
        hash: [u8;64],
    ) -> TestResult<()> {
        let ix = ExecuteTransactionBuilder::new()
            .config(hub_config)
            .relayer(payer.pubkey())
            .relayer_info(relayer_info)
            .transaction(transaction)
            .system_program(system_program)
            .sequence(sequence)
            .success(success)
            .hash(hash)
            .instruction();

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
            .await
    }

    pub async fn get_tx_status(
        &mut self,
        sequence: u64,
    ) -> TestResult<Status> {
        let (pool_address, _) =
            relayer_hub_sdk::derive_transaction_account_address(
                &relayer_hub_program,
                sequence
            );

        let pool_account = self
            .banks_client
            .get_account(pool_address)
            .await?
            .unwrap();
        let mut pool_account_data = pool_account.data.as_slice();
        let tx = HubTransaction::from_bytes(&mut pool_account_data)?;

        Ok::<Status, _>(tx.status)
    }

    pub async fn get_tx(
        &mut self,
        sequence: u64,
    ) -> TestResult<HubTransaction> {
        let (pool_address, _) =
            relayer_hub_sdk::derive_transaction_account_address(
                &relayer_hub_program,
                sequence
            );

        let pool_account = self
            .banks_client
            .get_account(pool_address)
            .await?
            .unwrap();
        let mut pool_account_data = pool_account.data.as_slice();
        let tx = HubTransaction::from_bytes(&mut pool_account_data)?;

        Ok(tx)
    }

    pub async fn do_finalize_transaction(
        &mut self,
        sequence: u64,
        payer: &Keypair,
        finalize: bool,
        state_root:[u8;32]
    ) -> TestResult<()> {
        let system_program = solana_program::system_program::id();
        let (hub_config, _) =relayer_hub_sdk::derive_config_account_address(&relayer_hub_program);
        let (transaction, _) =relayer_hub_sdk::derive_transaction_account_address(&relayer_hub_program, sequence);

        self.finalize_transaction(
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
        &mut self,
        hub_config: Pubkey,
        transaction: Pubkey,
        system_program: Pubkey,
        sequence: u64,
        payer: &Keypair,
        finalize: bool,
        state_root:[u8;32]
    ) -> TestResult<()> {
        let ix = FinalizeTransactionBuilder::new()
            .config(hub_config)
            .operator(payer.pubkey())
            .transaction(transaction)
            .system_program(system_program)
            .sequence(sequence)
            .finalize(finalize)
            .state_root(state_root)
            .instruction();

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
            .await
    }

    pub async fn get_all_can_finalize_tx(
        &mut self,
        epoch: u64,
    ) -> TestResult<(u64, u64)> {
        let (epoch_sequence_address, _) =
            relayer_hub_sdk::derive_epoch_sequence_address(
                &relayer_hub_program,
                epoch
            );

        let pool_account = self
            .banks_client
            .get_account(epoch_sequence_address)
            .await?
            .unwrap();
        let mut pool_account_data = pool_account.data.as_slice();
        let es = EpochSequence::from_bytes(&mut pool_account_data)?;

        Ok((es.begin_sequence, es.current_sequence))
    }

    pub async fn get_final_pool_count(
        &mut self,
    ) -> TestResult<u64> {
        let (pool_address, _) =
            relayer_hub_sdk::derive_final_pool_account_address(
                &relayer_hub_program,
            );

        let pool_account = self
            .banks_client
            .get_account(pool_address)
            .await?
            .unwrap();
        let mut pool_account_data = pool_account.data.as_slice();
        let pool = FinalTransactionPool::from_bytes(&mut pool_account_data)?;

        Ok(pool.total)
    }

    pub async fn get_final_tx(
        &mut self,
        epoch: u64,
    ) -> TestResult<FinalTransaction> {
        let (tx_address, _) =
            relayer_hub_sdk::derive_final_transaction_address(
                &relayer_hub_program,
                epoch,
            );

        let tx_account = self
            .banks_client
            .get_account(tx_address)
            .await?
            .unwrap();
        let mut tx_account_data = tx_account.data.as_slice();
        let tx = FinalTransaction::from_bytes(&mut tx_account_data)?;

        Ok(tx)
    }
}