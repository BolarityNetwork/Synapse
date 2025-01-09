mod push_transaction{
    use crate::{
        fixtures::{
            test_builder::TestBuilder, TestError,
            TestResult,
        },
        // helpers::ballot_box::serialized_ballot_box_account,
    };
    #[tokio::test]
    async fn test_push_transaction_ok() -> TestResult<()> {
        let mut fixture = TestBuilder::new().await;
        let test_ncn = fixture.create_initial_test_ncn(1, 1, None).await?;

        fixture.warp_slot_incremental(1000).await?;
        fixture.snapshot_test_ncn(&test_ncn).await?;

        let clock = fixture.clock().await;
        let epoch = clock.epoch;

        let ncn = test_ncn.ncn_root.ncn_pubkey;
        println!("{:?}", ncn);
        Ok(())
    }
}