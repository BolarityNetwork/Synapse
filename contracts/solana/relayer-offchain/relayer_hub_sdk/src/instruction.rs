use anchor_lang::{
    prelude::Pubkey, solana_program::instruction::Instruction, InstructionData, ToAccountMetas,
};

use crate::relayer_hub;

#[allow(clippy::too_many_arguments)]
pub fn rollup_transaction(
    rollup_authority: Pubkey,
    config: Pubkey,
    pool: Pubkey,
    transaction: Pubkey,
    system_program: Pubkey,
    accept: bool, state_root: [u8;32], vote: u8, epoch: u64
) -> Instruction {
    Instruction {
        program_id: relayer_hub::ID,
        accounts: relayer_hub::client::accounts::RollupTransaction {
            rollup_authority,
            config,
            pool,
            transaction,
            system_program,
        }
            .to_account_metas(None),
        data: relayer_hub::client::args::RollupTransaction {
            accept, state_root, vote, epoch
        }.data(),
    }
}