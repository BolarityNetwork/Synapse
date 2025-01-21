// use anchor_lang::{
//     prelude::Pubkey, solana_program::instruction::Instruction, InstructionData, ToAccountMetas,
// };
//
// use crate::relayer_hub;
//
// #[allow(clippy::too_many_arguments)]
// pub fn initialize_ix(
//     config: Pubkey,
//     relayer_info: Pubkey,
//     payer: Pubkey,
//     system_program: Pubkey,
//     authority: Pubkey,
// ) -> Instruction {
//     Instruction {
//         program_id: relayer_hub::ID,
//         accounts: relayer_hub::client::accounts::Initialize {
//             config,
//             relayer_info,
//             payer,
//             system_program,
//         }
//             .to_account_metas(None),
//         data: relayer_hub::client::args::Initialize {
//             authority,
//         }.data(),
//     }
// }
//
// #[allow(clippy::too_many_arguments)]
// pub fn register_tx_pool(
//     config: Pubkey,
//     pool: Pubkey,
//     final_pool: Pubkey,
//     owner: Pubkey,
//     system_program: Pubkey,
// ) -> Instruction {
//     Instruction {
//         program_id: relayer_hub::ID,
//         accounts: relayer_hub::client::accounts::RegisterTxPool {
//             config,
//             pool,
//             final_pool,
//             owner,
//             system_program,
//         }
//             .to_account_metas(None),
//         data: relayer_hub::client::args::RegisterTxPool {
//         }.data(),
//     }
// }
//
// #[allow(clippy::too_many_arguments)]
// pub fn register_relayer(
//     config: Pubkey,
//     relayer_info: Pubkey,
//     payer: Pubkey,
//     relayer: Pubkey,
//     system_program: Pubkey,
// ) -> Instruction {
//     Instruction {
//         program_id: relayer_hub::ID,
//         accounts: relayer_hub::client::accounts::RegisterRelayer {
//             config,
//             relayer_info,
//             payer,
//             system_program,
//             relayer,
//         }
//             .to_account_metas(None),
//         data: relayer_hub::client::args::RegisterRelayer {
//         }.data(),
//     }
// }
//
//
// #[allow(clippy::too_many_arguments)]
// pub fn init_transaction(
//     config: Pubkey,
//     pool: Pubkey,
//     relayer: Pubkey,
//     relayer_info: Pubkey,
//     transaction: Pubkey,
//     system_program: Pubkey,
//     sequence: u64,
//     data: Vec<u8>,
// ) -> Instruction {
//     Instruction {
//         program_id: relayer_hub::ID,
//         accounts: relayer_hub::client::accounts::InitTransaction {
//             config,
//             pool,
//             relayer,
//             relayer_info,
//             transaction,
//             system_program,
//         }
//             .to_account_metas(None),
//         data: relayer_hub::client::args::InitTransaction {
//             sequence,
//             data,
//         }.data(),
//     }
// }