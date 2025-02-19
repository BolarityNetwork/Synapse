use core::mem::size_of;

use bytemuck::{Pod, Zeroable};
use jito_bytemuck::{
    types::{PodU16, PodU64},
    AccountDeserialize, Discriminator,
};
use jito_bytemuck::types::PodBool;
use shank::{ShankAccount, ShankType};
use solana_program::{
    account_info::AccountInfo, msg, program_error::ProgramError, pubkey::Pubkey, rent::Rent,
    system_program,
};
use spl_math::precise_number::PreciseNumber;

use crate::{
    ballot_box::BallotBox,  constants::MAX_OPERATORS,
    discriminators::Discriminators, error::RelayerNcnError,  loaders::check_load,
};

#[derive(Debug, Clone, Copy, Zeroable, ShankType, Pod, AccountDeserialize, ShankAccount)]
#[repr(C)]
pub struct FinalTransaction {
    pub sequence: PodU64,
    pub state_root: [u8;32],
    pub epoch: PodU64,
    pub accepted: PodBool,
    pub votes: u8,
}

impl Discriminator for FinalTransaction {
    const DISCRIMINATOR: u8 = Discriminators::FinalTransaction as u8;
}

impl FinalTransaction {
    pub const SIZE: usize = 8 + size_of::<Self>();

    pub fn seeds(ncn_epoch: u64) -> Vec<Vec<u8>> {
        Vec::from_iter(
            [
                b"final_tx".to_vec(),
                ncn_epoch.to_le_bytes().to_vec(),
            ]
                .iter()
                .cloned(),
        )
    }

    pub fn find_program_address(
        program_id: &Pubkey,
        ncn_epoch: u64,
    ) -> (Pubkey, u8, Vec<Vec<u8>>) {
        let seeds: Vec<Vec<u8>> = Self::seeds(ncn_epoch);
        let seeds_iter: Vec<_> = seeds.iter().map(|s| s.as_slice()).collect();
        let (pda, bump) = Pubkey::find_program_address(&seeds_iter, program_id);
        (pda, bump, seeds)
    }

    pub fn load(
        program_id: &Pubkey,
        ncn_epoch: u64,
        account: &AccountInfo,
        expect_writable: bool,
    ) -> Result<(), ProgramError> {
        let expected_pda = Self::find_program_address(program_id, ncn_epoch).0;
        check_load(
            program_id,
            account,
            &expected_pda,
            Some(Self::DISCRIMINATOR),
            expect_writable,
        )
    }
}