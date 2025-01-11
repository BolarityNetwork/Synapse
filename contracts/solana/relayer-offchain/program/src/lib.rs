use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
    declare_id,
};
use const_str_to_pubkey::str_to_pubkey;
use shank::ShankInstruction;
use shank::{ShankAccount, ShankType};

declare_id!(str_to_pubkey(env!("RELAYER_NCN_PROGRAM_ID")));
// Program entrypoint
entrypoint!(process_instruction);

// Function to route instructions to the correct handler
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Unpack instruction data
    let instruction = CounterInstruction::unpack(instruction_data)?;

    // Match instruction type
    match instruction {
        CounterInstruction::InitializeCounter { initial_value } => {
            process_initialize_counter(program_id, accounts, initial_value)?
        }
        CounterInstruction::IncrementCounter => process_increment_counter(program_id, accounts)?,
    };
    Ok(())
}

// Instructions that our program can execute
#[derive(BorshSerialize, BorshDeserialize, Debug, ShankInstruction)]
pub enum CounterInstruction {
    #[account(0, signer, writable, name = "counter")]
    #[account(1, signer, name = "payer")]
    #[account(2, name = "system_program")]
    InitializeCounter { initial_value: u64 }, // variant 0
    #[account(0, writable, name = "counter")]
    IncrementCounter,                         // variant 1
}

impl CounterInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        // Get the instruction variant from the first byte
        let (&variant, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;

        // Match instruction type and parse the remaining bytes based on the variant
        match variant {
            0 => {
                // For InitializeCounter, parse a u64 from the remaining bytes
                let initial_value = u64::from_le_bytes(
                    rest.try_into()
                        .map_err(|_| ProgramError::InvalidInstructionData)?,
                );
                Ok(Self::InitializeCounter { initial_value })
            }
            1 => Ok(Self::IncrementCounter), // No additional data needed
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}

// Initialize a new counter account
fn process_initialize_counter(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    initial_value: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let counter_account = next_account_info(accounts_iter)?;
    let payer_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Size of our counter account
    let account_space = 8; // Size in bytes to store a u64

    // Calculate minimum balance for rent exemption
    let rent = Rent::get()?;
    let required_lamports = rent.minimum_balance(account_space);

    // Create the counter account
    invoke(
        &system_instruction::create_account(
            payer_account.key,    // Account paying for the new account
            counter_account.key,  // Account to be created
            required_lamports,    // Amount of lamports to transfer to the new account
            account_space as u64, // Size in bytes to allocate for the data field
            program_id,           // Set program owner to our program
        ),
        &[
            payer_account.clone(),
            counter_account.clone(),
            system_program.clone(),
        ],
    )?;

    // Create a new CounterAccount struct with the initial value
    let counter_data = CounterAccount {
        count: initial_value,
    };

    // Get a mutable reference to the counter account's data
    let mut account_data = &mut counter_account.data.borrow_mut()[..];

    // Serialize the CounterAccount struct into the account's data
    counter_data.serialize(&mut account_data)?;

    msg!("Counter initialized with value: {}", initial_value);

    Ok(())
}

// Update an existing counter's value
fn process_increment_counter(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let counter_account = next_account_info(accounts_iter)?;

    // Verify account ownership
    if counter_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Mutable borrow the account data
    let mut data = counter_account.data.borrow_mut();

    // Deserialize the account data into our CounterAccount struct
    let mut counter_data: CounterAccount = CounterAccount::try_from_slice(&data)?;

    // Increment the counter value
    counter_data.count = counter_data
        .count
        .checked_add(1)
        .ok_or(ProgramError::InvalidAccountData)?;

    // Serialize the updated counter data back into the account
    counter_data.serialize(&mut &mut data[..])?;

    msg!("Counter incremented to: {}", counter_data.count);
    Ok(())
}

// Struct representing our counter account's data
#[derive(BorshSerialize, BorshDeserialize, Debug, ShankType, ShankAccount)]
pub struct CounterAccount {
    count: u64,
}

// #[cfg(test)]
// mod test {
//     use super::*;
//     use solana_program_test::*;
//     use solana_sdk::{
//         instruction::{AccountMeta, Instruction},
//         signature::{Keypair, Signer},
//         system_program,
//         transaction::Transaction,
//     };
//
//     #[tokio::test]
//     async fn test_counter_program() {
//         let program_id = Pubkey::new_unique();
//         let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
//             "relayer_ncn_program",
//             program_id,
//             processor!(process_instruction),
//         )
//             .start()
//             .await;
//
//         // Create a new keypair to use as the address for our counter account
//         let counter_keypair = Keypair::new();
//         let initial_value: u64 = 42;
//
//         // Step 1: Initialize the counter
//         println!("Testing counter initialization...");
//
//         // Create initialization instruction
//         let mut init_instruction_data = vec![0]; // 0 = initialize instruction
//         init_instruction_data.extend_from_slice(&initial_value.to_le_bytes());
//
//         let initialize_instruction = Instruction::new_with_bytes(
//             program_id,
//             &init_instruction_data,
//             vec![
//                 AccountMeta::new(counter_keypair.pubkey(), true),
//                 AccountMeta::new(payer.pubkey(), true),
//                 AccountMeta::new_readonly(system_program::id(), false),
//             ],
//         );
//
//         // Send transaction with initialize instruction
//         let mut transaction =
//             Transaction::new_with_payer(&[initialize_instruction], Some(&payer.pubkey()));
//         transaction.sign(&[&payer, &counter_keypair], recent_blockhash);
//         banks_client.process_transaction(transaction).await.unwrap();
//
//         // Check account data
//         let account = banks_client
//             .get_account(counter_keypair.pubkey())
//             .await
//             .expect("Failed to get counter account");
//
//         if let Some(account_data) = account {
//             let counter: CounterAccount = CounterAccount::try_from_slice(&account_data.data)
//                 .expect("Failed to deserialize counter data");
//             assert_eq!(counter.count, 42);
//             println!(
//                 "✅ Counter initialized successfully with value: {}",
//                 counter.count
//             );
//         }
//
//         // Step 2: Increment the counter
//         println!("Testing counter increment...");
//
//         // Create increment instruction
//         let increment_instruction = Instruction::new_with_bytes(
//             program_id,
//             &[1], // 1 = increment instruction
//             vec![AccountMeta::new(counter_keypair.pubkey(), true)],
//         );
//
//         // Send transaction with increment instruction
//         let mut transaction =
//             Transaction::new_with_payer(&[increment_instruction], Some(&payer.pubkey()));
//         transaction.sign(&[&payer, &counter_keypair], recent_blockhash);
//         banks_client.process_transaction(transaction).await.unwrap();
//
//         // Check account data
//         let account = banks_client
//             .get_account(counter_keypair.pubkey())
//             .await
//             .expect("Failed to get counter account");
//
//         if let Some(account_data) = account {
//             let counter: CounterAccount = CounterAccount::try_from_slice(&account_data.data)
//                 .expect("Failed to deserialize counter data");
//             assert_eq!(counter.count, 43);
//             println!("✅ Counter incremented successfully to: {}", counter.count);
//         }
//     }
// }