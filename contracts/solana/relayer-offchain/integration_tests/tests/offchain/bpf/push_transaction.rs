mod push_transaction{
    use solana_program::clock::DEFAULT_SLOTS_PER_EPOCH;
    use crate::{
        fixtures::{
            test_builder::TestBuilder, TestError,
            TestResult,
        },
        // helpers::ballot_box::serialized_ballot_box_account,
    };
    use relayer_ncn_core::{
        ballot_box::{Ballot, BallotBox},
        config::Config as NcnConfig,
        error::RelayerNcnError,
    };
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
        for i in 0..relayer_count {
            // let operator = test_ncn.operators[i].operator_pubkey;
            let operator_admin = &test_ncn.operators[i].operator_admin;

            relayer_hub_client
                .do_register_relayer(operator_admin)
                .await?;
        }
        let tx_nonce = relayer_hub_client.get_pool_sequence().await?;
        let vaa_bytes =
            &hex_literal::hex!["010000000001002a5d283a7c37d93184a693a612a41278559a7ddbe446bd4e5fc92024135d719b3d4a9ca5ca150fa256edb3280a9b58c70c2c62ae87511188078b2b3216b1928901676e11ff0000000000013b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98000000000000758b20010000000000000000000000000000000000000000000000000000000000989680069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f000000000010001e8de75ef9e847ee05ed3d828e307b24c427e55b918ba81de3c0ae12570284afb00150000000000000000000000000000000000000000000000000000000000000000"];
        relayer_hub_client
            .do_init_transaction(tx_nonce, current_relayer_admin, vaa_bytes.to_vec())
            .await?;

        let total = relayer_hub_client.get_tx_count().await?;
        assert_eq!(total, 1);

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