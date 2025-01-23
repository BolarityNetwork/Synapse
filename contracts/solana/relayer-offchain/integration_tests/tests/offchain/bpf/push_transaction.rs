mod push_transaction{
    use solana_program::clock::DEFAULT_SLOTS_PER_EPOCH;
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

    #[tokio::test]
    async fn test_push_transaction_ok() -> TestResult<()> {
        let mut fixture = TestBuilder::new().await;
        let mut relayer_ncn_client = fixture.relayer_ncn_client();
        let mut relayer_hub_client = fixture.relayer_hub_client();
        let relayer_count = 3;
        let test_ncn = fixture.create_initial_test_ncn(relayer_count, 1, None).await?;

        fixture.warp_slot_incremental(1000).await?;
        fixture.snapshot_test_ncn(&test_ncn).await?;

        let ncn = test_ncn.ncn_root.ncn_pubkey;
        let ncn_config_address =
            NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn).0;

        relayer_hub_client
            .do_initialize(ncn_config_address)
            .await?;
        // register transaction pool.
        relayer_hub_client
            .do_register_tx_pool()
            .await?;
        let clock = fixture.clock().await;
        let epoch = clock.epoch;
        let current_relayer_admin = &test_ncn.operators[(epoch % relayer_count as u64)as usize].operator_admin;
        // ==================Register relayer====================
        for i in 0..relayer_count {
            // let operator = test_ncn.operators[i].operator_pubkey;
            let operator_admin = &test_ncn.operators[i].operator_admin;

            relayer_hub_client
                .do_register_relayer(operator_admin)
                .await?;
        }
        // ==================Relayer Records Transactions into Bolarity Network====================
        let mut tx_nonce = relayer_hub_client.get_pool_sequence().await?;
        let vaas =[
            hex_literal::hex!["010000000001002a5d283a7c37d93184a693a612a41278559a7ddbe446bd4e5fc92024135d719b3d4a9ca5ca150fa256edb3280a9b58c70c2c62ae87511188078b2b3216b1928901676e11ff0000000000013b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98000000000000758b20010000000000000000000000000000000000000000000000000000000000989680069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f000000000010001e8de75ef9e847ee05ed3d828e307b24c427e55b918ba81de3c0ae12570284afb00150000000000000000000000000000000000000000000000000000000000000000"].as_slice(),
            hex_literal::hex!["01000000000100cb82b817f415a0f9c73749bbbdbdad96af2a48e08771716a8349edcc718249a72195fb1370e275937afe33e74b1948f93dde71533c74f12debfc02629fdd3dc000678e0f8d000000000001aac824d6e431b2a5021ab896d74701cc5fbf5ef13744e48f91fc8c7b3fc70292000000000000026701130ca9b40bfe60fa1cf42b040442d590c3429e664a401813e36b04c39daa0157000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000824cb8fc742f8d3300d29f16ca8bee94471169f5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044095ea7b30000000000000000000000007fb0d63258caf51d8a35130d3f7a7fd1ee893969ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000"].as_slice(),
            hex_literal::hex!["010000000001003bcf09d8143e07223ddc0b2ffb7df7655d9e43fbcc94ddb17684ba78e861fa0119b059a9613907a937b1c9472601f343764b1c59cb4a91c6bb4f8710b0db975100678f891f0000000000013b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98000000000000765f20030000000000000000000000000000000000000000000000000000000008e18f40069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f0000000000100010000000000000000000000007fb0d63258caf51d8a35130d3f7a7fd1ee8939692712c94173cc83e460d64a8b533b87dbfd29485f796e5f11e0150bc429f6e2690b800100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f6cda71287569518fc8baa7462330df01365497d"].as_slice(),
        ];
        let vaa = vaas[0];

        relayer_hub_client
            .do_init_transaction(tx_nonce, current_relayer_admin, vaa.to_vec())
            .await?;

        let mut total = relayer_hub_client.get_pool_count().await?;
        assert_eq!(total, 1);
        tx_nonce = relayer_hub_client.get_pool_sequence().await?;
        let vaa2 =vaas[1];
        relayer_hub_client
            .do_init_transaction(tx_nonce, current_relayer_admin, vaa2.to_vec())
            .await?;
        total = relayer_hub_client.get_pool_count().await?;
        assert_eq!(total, 2);

        tx_nonce = relayer_hub_client.get_pool_sequence().await?;
        let vaa2 =vaas[2];
        relayer_hub_client
            .do_init_transaction(tx_nonce, current_relayer_admin, vaa2.to_vec())
            .await?;
        total = relayer_hub_client.get_pool_count().await?;
        assert_eq!(total, 3);
        // ==================Relayer Monitors Transaction States in Parallel===========
        for i in 0..total {
            relayer_hub_client
                .do_execute_transaction(i, current_relayer_admin, true)
                .await?;
            let status = relayer_hub_client.get_tx_status(i).await?;
            assert_eq!(status, Status::Executed);
        }
        // ==================Operator Validates Transactions and Prepares State Roots( offchain)==============
        // TODO:generate state root
        // let mt = MerkleTree::new(&vaas, false);
        // println!("==================root:{:?}", mt.get_root());
        // println!("==================node:{:?}", mt.find_path(0));
        for i in 0..total {
            relayer_hub_client
                .do_finalize_transaction(i, current_relayer_admin, true, [0u8;32])
                .await?;
            let status = relayer_hub_client.get_tx_status(i).await?;
            assert_eq!(status, Status::Finality);
        }

        // // Initialize ballot box
        // relayer_ncn_client
        //     .do_full_initialize_ballot_box(ncn, epoch)
        //     .await?;
        // let winning_root = [1u8;32];
        //
        //
        // relayer_ncn_client
        //     .do_cast_vote(ncn, operator1, operator1_admin, winning_root, epoch)
        //     .await?;
        //
        // relayer_ncn_client
        //     .do_cast_vote(ncn, operator2, operator2_admin, winning_root, epoch)
        //     .await?;


        Ok(())
    }
}