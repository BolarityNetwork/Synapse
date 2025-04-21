mod push_transaction{
    use solana_program::clock::DEFAULT_SLOTS_PER_EPOCH;
    use solana_sdk::signature::Keypair;
    use solana_sdk::signer::Signer;
    use relayer_hub_client::types::Status;
    use crate::{
        fixtures::{
            test_builder::TestBuilder, TestError,
            TestResult,
        },
    };
    use relayer_ncn_core::{
        config::Config as NcnConfig,
    };
    use merkle_tree::merkle_tree::MerkleTree;

    const RELAYER_COUNT:usize = 3;
    const OPERATOR_COUNT:usize = 3;
    #[tokio::test]
    async fn test_push_transaction_ok() -> TestResult<()> {
        let mut fixture = TestBuilder::new().await;
        let mut relayer_ncn_client = fixture.relayer_ncn_client();
        let mut relayer_hub_client = fixture.relayer_hub_client();
        let test_ncn = fixture.create_initial_test_ncn(OPERATOR_COUNT, 1, None).await?;

        fixture.warp_slot_incremental(1000).await?;
        fixture.snapshot_test_ncn(&test_ncn).await?;

        let ncn = test_ncn.ncn_root.ncn_pubkey;
        let ncn_config_address =
            NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn).0;
        let bump =
            NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn).1;

        relayer_hub_client
            .do_initialize(ncn_config_address)
            .await?;
        // register transaction pool.
        relayer_hub_client
            .do_register_tx_pool()
            .await?;
        let clock = fixture.clock().await;
        let epoch = clock.epoch;
        let mut relayer_keypair_list:Vec<Keypair> = vec![];

        // ==================Register relayer====================
        for i in 0..RELAYER_COUNT {
            let relayer_keypair = Keypair::new();
            relayer_ncn_client.airdrop(&relayer_keypair.pubkey(), 1.0).await?;
            relayer_hub_client
                .do_register_relayer(&relayer_keypair)
                .await?;
            relayer_keypair_list.push(relayer_keypair);
        }
        let current_relayer = &relayer_keypair_list[(epoch % RELAYER_COUNT as u64) as usize];
        // ==================Relayer Records Transactions into Bolarity Network====================
        let chain:u16 = 1;
        let chain_address = [1u8;32];
        let mut sequence = 1;
        let hash = [1u8;64];

        relayer_hub_client
            .do_init_execute_transaction( current_relayer, chain, chain_address, sequence, epoch, true, hash)
            .await?;

        let mut total = relayer_hub_client.get_pool_count().await?;
        assert_eq!(total, 1);

        sequence += 1;
        relayer_hub_client
            .do_init_execute_transaction(current_relayer, chain, chain_address, sequence, epoch, true, hash)
            .await?;
        total = relayer_hub_client.get_pool_count().await?;
        assert_eq!(total, 2);

        sequence += 1;
        relayer_hub_client
            .do_init_execute_transaction(current_relayer, chain, chain_address, sequence, epoch, true, hash)
            .await?;
        total = relayer_hub_client.get_pool_count().await?;
        assert_eq!(total, 3);
        // ==================Relayer Monitors Transaction States in Parallel===========
        for i in 1..=total {
            let status = relayer_hub_client.get_tx_status(chain, chain_address, i).await?;
            assert_eq!(status, Status::Executed);
        }
        // ==================Operator Validates Transactions and Prepares State Roots( offchain)==============
        let current_operator = &test_ncn.operators[(epoch % OPERATOR_COUNT as u64)as usize].operator_admin;
        let mut sequences = vec![];
        let mut hashs = vec![];
        // Find transactions that are in the Executed or Failing state in a certain epoch.
        let state_root = if let Ok((begin_sequence, current_sequence))= relayer_hub_client.get_all_can_finalize_tx(epoch).await {
            for i in begin_sequence..=current_sequence {
                let tx = relayer_hub_client.get_tx(chain, chain_address, i).await?;
                if tx.status == Status::Executed || tx.status == Status::Failing {
                    sequences.push(i);
                    hashs.push(tx.hash);
                }
            }
            let byte_vecs: Vec<Vec<u8>> = hashs
                .iter()
                .map(|&num| {
                    num.to_vec()
                })
                .collect();
            let mt = MerkleTree::new(&byte_vecs, false);
            let state_root = mt.get_root().unwrap().to_bytes();
            for sequence in sequences{
                relayer_hub_client
                    .do_finalize_transaction(chain, chain_address, sequence, current_operator, true, state_root)
                    .await?;
                let status = relayer_hub_client.get_tx_status(chain, chain_address, sequence).await?;
                assert_eq!(status, Status::Finality);
                let root = relayer_hub_client.get_tx(chain, chain_address, sequence).await?;
                assert_eq!(root.state_root, state_root);
            }
            state_root
        } else {
            [0u8;32]
        };
        // ========================Operator Conducts Voting==============================
        // Initialize ballot box
        relayer_ncn_client
            .do_full_initialize_ballot_box(ncn, epoch)
            .await?;
        let winning_root = state_root;

        for i in 0..OPERATOR_COUNT {
            let operator = test_ncn.operators[i].operator_pubkey;
            let operator_admin = &test_ncn.operators[i].operator_admin;

            relayer_ncn_client
                .do_cast_vote(ncn, operator, operator_admin, winning_root, epoch)
                .await?;
        }
        relayer_ncn_client.do_rollup_transaction(ncn, epoch, current_operator).await?;

        total = relayer_hub_client.get_final_pool_count().await?;
        assert_eq!(total, 1);
        let final_tx = relayer_hub_client.get_final_tx(epoch).await?;
        assert_eq!(final_tx.state_root, state_root);
        assert!(final_tx.votes>=66);
        Ok(())
    }
}