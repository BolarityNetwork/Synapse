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
        let test_ncn = fixture.create_initial_test_ncn(1, 1, None).await?;

        fixture.warp_slot_incremental(1000).await?;
        fixture.snapshot_test_ncn(&test_ncn).await?;

        let clock = fixture.clock().await;
        let epoch = clock.epoch;

        let ncn = test_ncn.ncn_root.ncn_pubkey;
        let ncn_config_address =
            NcnConfig::find_program_address(&relayer_ncn_program::id(), &ncn).0;

        // Initialize ballot box
        relayer_ncn_client
            .do_full_initialize_ballot_box(ncn, epoch)
            .await?;
        let winning_root = [1u8;32];

        let operator = test_ncn.operators[0].operator_pubkey;
        let operator_admin = &test_ncn.operators[0].operator_admin;

        relayer_ncn_client
            .do_cast_vote(ncn, operator, operator_admin, winning_root, epoch)
            .await?;
        Ok(())
    }
}