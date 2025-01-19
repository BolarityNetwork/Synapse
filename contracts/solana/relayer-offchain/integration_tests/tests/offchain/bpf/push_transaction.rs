mod push_transaction{
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
        let test_ncn = fixture.create_initial_test_ncn(2, 1, None).await?;

        fixture.warp_slot_incremental(1000).await?;
        fixture.snapshot_test_ncn(&test_ncn).await?;

        let clock = fixture.clock().await;
        let epoch = clock.epoch;

        let ncn = test_ncn.ncn_root.ncn_pubkey;
        let ncn_config_address =
            NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn).0;

        relayer_hub_client
            .do_initialize(ncn_config_address)
            .await?;
        // test chain ID
        let chain = 1;

        relayer_hub_client
            .do_register_tx_pool(chain)
            .await?;

        // Initialize ballot box
        relayer_ncn_client
            .do_full_initialize_ballot_box(ncn, epoch)
            .await?;
        let winning_root = [1u8;32];

        let operator1 = test_ncn.operators[0].operator_pubkey;
        let operator1_admin = &test_ncn.operators[0].operator_admin;
        let operator2 = test_ncn.operators[1].operator_pubkey;
        let operator2_admin = &test_ncn.operators[1].operator_admin;

        // register relayer1
        relayer_hub_client
            .do_register_relayer(operator1_admin)
            .await?;
        // register relayer2
        relayer_hub_client
            .do_register_relayer(operator2_admin)
            .await?;

        relayer_ncn_client
            .do_cast_vote(ncn, operator1, operator1_admin, winning_root, epoch)
            .await?;

        relayer_ncn_client
            .do_cast_vote(ncn, operator2, operator2_admin, winning_root, epoch)
            .await?;

        let sequence = 1;

        relayer_ncn_client
            .do_send_transaction(ncn, epoch, chain, sequence)
            .await?;

        let total = relayer_hub_client.get_tx_count(chain).await?;
        assert_eq!(total, 1);
        Ok(())
    }
}