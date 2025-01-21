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
use relayer_hub_client::instructions::{InitTransactionBuilder, InitializeBuilder, RegisterRelayerBuilder, RegisterTxPoolBuilder};
use crate::fixtures::TestResult;
use relayer_hub_client::programs::RELAYER_HUB_ID as relayer_hub_program;
use relayer_hub_client::accounts::TransactionPool;
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
        // let ix = relayer_hub_sdk::instruction::register_tx_pool(
        //     config,
        //     pool,
        //     final_pool,
        //     self.payer.pubkey(),
        //     system_program,
        // );

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
                                     operator_admin: &Keypair,) -> TestResult<()> {
        let (config, _) =
            relayer_hub_sdk::derive_config_account_address(&relayer_hub_program);
        let (relayer_info, _) =relayer_hub_sdk::derive_relayer_info_account_address(&relayer_hub_program);
        let system_program = solana_program::system_program::id();
        // let payer = Keypair::new();
        // self.airdrop(&payer.pubkey(), 1.0).await?;
        let (relayer, _) =relayer_hub_sdk::derive_relayer_account_address(&relayer_hub_program, &operator_admin.pubkey());

        self.register_relayer(
            relayer,
            relayer_info,
            config,
            system_program,
            operator_admin,
        )
            .await
    }

    pub async fn register_relayer(
        &mut self,
        relayer: Pubkey,
        relayer_info: Pubkey,
        config: Pubkey,
        system_program: Pubkey,
        operator_admin: &Keypair,
    ) -> TestResult<()> {
        // let ix = relayer_hub_sdk::instruction::register_relayer(
        //     config,
        //     relayer_info,
        //     operator_admin.pubkey(),
        //     relayer,
        //     system_program,
        // );
        let ix = RegisterRelayerBuilder::new()
            .config(config)
            .relayer_info(relayer_info)
            .payer(operator_admin.pubkey())
            .relayer(relayer)
            .system_program(system_program)
            .instruction();

        let blockhash = self.banks_client.get_latest_blockhash().await?;
        self.process_transaction(&Transaction::new_signed_with_payer(
            &[ix],
            Some(&operator_admin.pubkey()),
            &[&operator_admin],
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
    ) -> TestResult<()> {
        let (relayer_info, _) =relayer_hub_sdk::derive_relayer_info_account_address(&relayer_hub_program);
        let (pool, _) =relayer_hub_sdk::derive_pool_account_address(&relayer_hub_program);
        let system_program = solana_program::system_program::id();
        let (hub_config, _) =relayer_hub_sdk::derive_config_account_address(&relayer_hub_program);
        let (transaction, _) =relayer_hub_sdk::derive_transaction_account_address(&relayer_hub_program, sequence);
        self.init_transaction(
            hub_config,
            relayer_info,
            pool,
            transaction,
            system_program,
            sequence,
            payer,
            data,
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
    ) -> TestResult<()> {
        // let ix = relayer_hub_sdk::instruction::init_transaction(
        //     hub_config,
        //     pool,
        //     payer.pubkey(),
        //     relayer_info,
        //     transaction,
        //     system_program,
        //     sequence,
        //     data,
        // );
        let ix = InitTransactionBuilder::new()
            .config(hub_config)
            .pool(pool)
            .relayer(payer.pubkey())
            .relayer_info(relayer_info)
            .transaction(transaction)
            .system_program(system_program)
            .sequence(sequence)
            .data(data)
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

    pub async fn get_tx_count(
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
}