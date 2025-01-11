use anchor_lang::{
    prelude::Pubkey, solana_program::instruction::Instruction, InstructionData, ToAccountMetas,
};

use crate::relayer_hub;

#[allow(clippy::too_many_arguments)]
pub fn initialize_ix(
    config: Pubkey,
    relayer_info: Pubkey,
    payer: Pubkey,
    system_program: Pubkey,
) -> Instruction {
    Instruction {
        program_id: relayer_hub::ID,
        accounts: relayer_hub::client::accounts::Initialize {
            config,
            relayer_info,
            payer,
            system_program,
        }
            .to_account_metas(None),
        data: relayer_hub::client::args::Initialize {
        }
            .data(),
    }
}