use anchor_lang::prelude::*;

pub use context::*;
pub use error::*;
pub use message::*;
pub use state::*;

pub mod context;
pub mod error;
pub mod message;
pub mod state;

declare_id!("5tFEXwUwpAzMXBWUSjQNWVfEh7gKbTc5hQMqBwi8jQ7k");

#[program]
/// # Hello World (Scaffolding Example #1)
///
/// A Cross-Chain Hello World application. This contract uses Wormhole's
/// generic messaging to send an arbitrary message to registered emitters on
/// foreign networks.
///
/// ## Program Instructions
/// * [`initialize`](initialize)
/// * [`register_emitter`](register_emitter)
/// * [`send_message`](send_message)
/// * [`receive_message`](receive_message)
///
/// ## Program Accounts
/// * [Config]
/// * [ForeignEmitter]
/// * [Received]
/// * [WormholeEmitter]
pub mod relayer_solana {
    use anchor_lang::__private::bytemuck::bytes_of;
    use super::*;
    use anchor_lang::solana_program;
    use anchor_lang::system_program;
    use solana_program::instruction::Instruction;
    use solana_program::program::{invoke, invoke_signed};
    use solana_program::system_instruction;
    use wormhole_anchor_sdk::wormhole;
    use wormhole_io::Writeable;

    /// This instruction initializes the program config, which is meant
    /// to store data useful for other instructions. The config specifies
    /// an owner (e.g. multisig) and should be read-only for every instruction
    /// in this example. This owner will be checked for designated owner-only
    /// instructions like [`register_emitter`](register_emitter).
    ///
    /// # Arguments
    ///
    /// * `ctx` - `Initialize` context
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;

        // Set the owner of the config (effectively the owner of the program).
        config.owner = ctx.accounts.owner.key();

        // Set Wormhole related addresses.
        {
            let wormhole = &mut config.wormhole;

            // wormhole::BridgeData (Wormhole's program data).
            wormhole.bridge = ctx.accounts.wormhole_bridge.key();

            // wormhole::FeeCollector (lamports collector for posting
            // messages).
            wormhole.fee_collector = ctx.accounts.wormhole_fee_collector.key();

            // wormhole::SequenceTracker (tracks # of messages posted by this
            // program).
            wormhole.sequence = ctx.accounts.wormhole_sequence.key();
        }

        // Set default values for posting Wormhole messages.
        //
        // Zero means no batching.
        config.batch_id = 0;

        // Anchor IDL default coder cannot handle wormhole::Finality enum,
        // so this value is stored as u8.
        config.finality = wormhole::Finality::Confirmed as u8;

        // Initialize our Wormhole emitter account. It is not required by the
        // Wormhole program that there is an actual account associated with the
        // emitter PDA. The emitter PDA is just a mechanism to have the program
        // sign for the `wormhole::post_message` instruction.
        //
        // But for fun, we will store our emitter's bump for convenience.
        ctx.accounts.wormhole_emitter.bump = ctx.bumps.wormhole_emitter;

        // This scope shows the steps of how to post a message with the
        // Wormhole program.
        {
            // If Wormhole requires a fee before posting a message, we need to
            // transfer lamports to the fee collector. Otherwise
            // `wormhole::post_message` will fail.
            let fee = ctx.accounts.wormhole_bridge.fee();
            if fee > 0 {
                solana_program::program::invoke(
                    &solana_program::system_instruction::transfer(
                        &ctx.accounts.owner.key(),
                        &ctx.accounts.wormhole_fee_collector.key(),
                        fee,
                    ),
                    &ctx.accounts.to_account_infos(),
                )?;
            }

            // Invoke `wormhole::post_message`. We are sending a Wormhole
            // message in the `initialize` instruction so the Wormhole program
            // can create a SequenceTracker account for our emitter. We will
            // deserialize this account for our `send_message` instruction so
            // we can find the next sequence number. More details about this in
            // `send_message`.
            //
            // `wormhole::post_message` requires two signers: one for the
            // emitter and another for the wormhole message data. Both of these
            // accounts are owned by this program.
            //
            // There are two ways to handle the wormhole message data account:
            //   1. Using an extra keypair. You may to generate a keypair
            //      outside of this instruction and pass that keypair as an
            //      additional signer for the transaction. An integrator might
            //      use an extra keypair if the message can be "thrown away"
            //      (not easily retrievable without going back to this
            //      transaction hash to retrieve the message's pubkey).
            //   2. Generate a PDA. If we want some way to deserialize the
            //      message data written by the Wormhole program, we can use an
            //      account with an address derived by this program so we can
            //      use the PDA to access and deserialize the message data.
            //
            // In our example, we use method #2.
            let wormhole_emitter = &ctx.accounts.wormhole_emitter;
            let config = &ctx.accounts.config;

            // If anyone were to care about the first message this program
            // emits, he can deserialize it to find the program with which
            // the emitter PDA was derived.
            let mut payload: Vec<u8> = Vec::new();
            HelloWorldMessage::serialize(
                &HelloWorldMessage::Alive {
                    program_id: *ctx.program_id,
                },
                &mut payload,
            )?;

            wormhole::post_message(
                CpiContext::new_with_signer(
                    ctx.accounts.wormhole_program.to_account_info(),
                    wormhole::PostMessage {
                        config: ctx.accounts.wormhole_bridge.to_account_info(),
                        message: ctx.accounts.wormhole_message.to_account_info(),
                        emitter: wormhole_emitter.to_account_info(),
                        sequence: ctx.accounts.wormhole_sequence.to_account_info(),
                        payer: ctx.accounts.owner.to_account_info(),
                        fee_collector: ctx.accounts.wormhole_fee_collector.to_account_info(),
                        clock: ctx.accounts.clock.to_account_info(),
                        rent: ctx.accounts.rent.to_account_info(),
                        system_program: ctx.accounts.system_program.to_account_info(),
                    },
                    &[
                        &[
                            SEED_PREFIX_SENT,
                            &wormhole::INITIAL_SEQUENCE.to_le_bytes()[..],
                            &[ctx.bumps.wormhole_message],
                        ],
                        &[wormhole::SEED_PREFIX_EMITTER, &[wormhole_emitter.bump]],
                    ],
                ),
                config.batch_id,
                payload,
                config.finality.try_into().unwrap(),
            )?;
        }

        // Done.
        Ok(())
    }

    /// This instruction registers a new foreign emitter (from another network)
    /// and saves the emitter information in a ForeignEmitter account. This
    /// instruction is owner-only, meaning that only the owner of the program
    /// (defined in the [Config] account) can add and update emitters.
    ///
    /// # Arguments
    ///
    /// * `ctx`     - `RegisterForeignEmitter` context
    /// * `chain`   - Wormhole Chain ID
    /// * `address` - Wormhole Emitter Address
    pub fn register_emitter(
        ctx: Context<RegisterEmitter>,
        chain: u16,
        address: [u8; 32],
    ) -> Result<()> {
        // Foreign emitter cannot share the same Wormhole Chain ID as the
        // Solana Wormhole program's. And cannot register a zero address.
        require!(
            chain > 0 && chain != wormhole::CHAIN_ID_SOLANA && !address.iter().all(|&x| x == 0),
            HelloWorldError::InvalidForeignEmitter,
        );

        // Save the emitter info into the ForeignEmitter account.
        let emitter = &mut ctx.accounts.foreign_emitter;
        emitter.chain = chain;
        emitter.address = address;

        // Done.
        Ok(())
    }

    /// This instruction posts a Wormhole message of some arbitrary size
    /// in the form of bytes ([Vec<u8>]). The message is encoded as
    /// [HelloWorldMessage::Hello], which serializes a payload ID (1) before the message
    /// specified in the instruction. Instead of using the native borsh
    /// serialization of [Vec] length (little endian u32), length of the
    /// message is encoded as big endian u16 (in EVM, bytes for numerics are
    /// natively serialized as big endian).
    ///
    /// See [HelloWorldMessage] enum for serialization implementation.
    ///
    /// # Arguments
    ///
    /// * `message` - Arbitrary message to send out
    pub fn send_message(ctx: Context<SendMessage>, message: Vec<u8>) -> Result<()> {
        // If Wormhole requires a fee before posting a message, we need to
        // transfer lamports to the fee collector. Otherwise
        // `wormhole::post_message` will fail.
        let fee = ctx.accounts.wormhole_bridge.fee();
        if fee > 0 {
            solana_program::program::invoke(
                &solana_program::system_instruction::transfer(
                    &ctx.accounts.payer.key(),
                    &ctx.accounts.wormhole_fee_collector.key(),
                    fee,
                ),
                &ctx.accounts.to_account_infos(),
            )?;
        }

        // Invoke `wormhole::post_message`.
        //
        // `wormhole::post_message` requires two signers: one for the emitter
        // and another for the wormhole message data. Both of these accounts
        // are owned by this program.
        //
        // There are two ways to handle the wormhole message data account:
        //   1. Using an extra keypair. You may to generate a keypair outside
        //      of this instruction and pass that keypair as an additional
        //      signer for the transaction. An integrator might use an extra
        //      keypair if the message can be "thrown away" (not easily
        //      retrievable without going back to this transaction hash to
        //      retrieve the message's pubkey).
        //   2. Generate a PDA. If we want some way to deserialize the message
        //      data written by the Wormhole program, we can use an account
        //      with an address derived by this program so we can use the PDA
        //      to access and deserialize the message data.
        //
        // In our example, we use method #2.
        let wormhole_emitter = &ctx.accounts.wormhole_emitter;
        let config = &ctx.accounts.config;

        // There is only one type of message that this example uses to
        // communicate with its foreign counterparts (payload ID == 1).
        // let payload: Vec<u8> = HelloWorldMessage::Hello { message }.try_to_vec()?;

        wormhole::post_message(
            CpiContext::new_with_signer(
                ctx.accounts.wormhole_program.to_account_info(),
                wormhole::PostMessage {
                    config: ctx.accounts.wormhole_bridge.to_account_info(),
                    message: ctx.accounts.wormhole_message.to_account_info(),
                    emitter: wormhole_emitter.to_account_info(),
                    sequence: ctx.accounts.wormhole_sequence.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    fee_collector: ctx.accounts.wormhole_fee_collector.to_account_info(),
                    clock: ctx.accounts.clock.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[
                    &[
                        SEED_PREFIX_SENT,
                        &ctx.accounts.wormhole_sequence.next_value().to_le_bytes()[..],
                        &[ctx.bumps.wormhole_message],
                    ],
                    &[wormhole::SEED_PREFIX_EMITTER, &[wormhole_emitter.bump]],
                ],
            ),
            config.batch_id,
            message,
            config.finality.try_into().unwrap(),
        )?;

        // Done.
        Ok(())
    }

    /// This instruction reads a posted verified Wormhole message and verifies
    /// that the payload is of type [HelloWorldMessage::Hello] (payload ID == 1). HelloWorldMessage
    /// data is stored in a [Received] account.
    ///
    /// See [HelloWorldMessage] enum for deserialization implementation.
    ///
    /// # Arguments
    ///
    /// * `vaa_hash` - Keccak256 hash of verified Wormhole message
    pub fn receive_message<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, ReceiveMessage<'info>>, vaa_hash: [u8; 32], bump:u8, chain: u16, address:[u8;32]) -> Result<()> {
        let posted_message = &ctx.accounts.posted;
        // Save batch ID, keccak256 hash and message payload.
        let received = &mut ctx.accounts.received;
        received.batch_id = posted_message.batch_id();
        received.wormhole_message_hash = vaa_hash;
        received.message = vec![];

        let seeds = b"pda";
        let signer_seeds: &[&[&[u8]]] = &[&[seeds,&chain.to_le_bytes(), address.as_slice(), &[bump]]];
         // let account_list = RawData::deserialize(&mut &*data)?;
        let raw_data = posted_message.data().clone();
        msg!("{:?}", raw_data);
        let transfer_buf:[u8;8] = [0x27, 0xf5 ,0x76, 0xca, 0xfb, 0xb2, 0x63, 0xed];
        let active_buf:[u8;8]=[0x96 , 0x87 , 0x96 , 0x11 , 0x65 , 0x0f , 0x80 , 0xa8];
        let cross_tsf_buf:[u8;8] = [99, 114, 111, 115, 115, 116, 115, 102];
        let transfer_ins = transfer_buf.to_vec();
        let active_ins = active_buf.to_vec();
        let mut accounts:Vec<AccountMeta>=vec![];
        let mut acc_infos = vec![];
        let mut i  = 0;
        for account in ctx.remaining_accounts {
            let is_signer = raw_data.accounts[i].is_signer;
            let writeable = raw_data.accounts[i].writeable;
            if writeable {
                accounts.push(AccountMeta::new(account.key(), is_signer));
            } else {
                accounts.push(AccountMeta::new_readonly(account.key(), is_signer));
            }
            acc_infos.push(account.to_account_info());
            i+=1;
            if i == raw_data.acc_count as usize{
                break
            }
        }
        let para_data =  &raw_data.paras[32..];
        let ins: Vec<u8> = para_data.iter().take(8).cloned().collect();
        if ins == transfer_ins || ins == cross_tsf_buf {
            // transer
            let bytes:[u8;8] = para_data[8..16].try_into().expect("Slice length must be 8");
            let amount = u64::from_le_bytes(bytes);
            let from_pubkey = acc_infos[0].to_account_info();
            let to_pubkey = acc_infos[1].to_account_info();
            // **from_pubkey.try_borrow_mut_lamports()? -= amount;
            // **to_pubkey.try_borrow_mut_lamports()? += amount;
            let transfer_instruction = system_instruction::transfer(
                &from_pubkey.key(),
                &to_pubkey.key(),
                amount,
            );
            invoke_signed(
                &transfer_instruction,
                &[
                    from_pubkey.to_account_info(),
                    to_pubkey.to_account_info(),
                ],
                signer_seeds
            )?;
        } else if ins == active_ins {
            let (pda, bump) = Pubkey::find_program_address(&[seeds,&chain.to_le_bytes(), address.as_slice()], ctx.program_id);

            let lamports = (Rent::get()?).minimum_balance(0);

            let create_account_ix = system_instruction::create_account(
                &ctx.accounts.payer.key,
                &pda,
                lamports,
                0,
                &ctx.accounts.system_program.key,
            );

            invoke_signed(
                &create_account_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                    acc_infos[0].to_account_info(),
                ],
                signer_seeds,
            )?;
        } else{
            let instruction: Instruction = Instruction {
                program_id: ctx.accounts.program_account.key(),
                accounts,
                data:para_data.to_vec(),
            };

            invoke_signed(&instruction, &acc_infos, signer_seeds)?;
        }
        // Done
        Ok(())
    }

    pub fn active(
        ctx: Context<Active>,
        chain: u16,
        address: [u8; 32],
    ) -> Result<()> {
        // pda cannot share the same Wormhole Chain ID as the
        // Solana Wormhole program's. And cannot register a zero address.
        require!(
            chain > 0 && chain != wormhole::CHAIN_ID_SOLANA && !address.iter().all(|&x| x == 0),
            HelloWorldError::InvalidForeignEmitter,
        );
        // // Save the emitter info into the pda account.
        // let pda = &mut ctx.accounts.pda;
        // pda.chain = chain;
        // pda.address = address;
        // Done.
        Ok(())
    }

    pub fn receive_message2<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, ReceiveMessage2<'info>>, data:Vec<u8>, bump:u8, chain: u16, address:[u8;32]) -> Result<()> {

        let seeds = b"pda";
        let signer_seeds: &[&[&[u8]]] = &[&[seeds,&chain.to_le_bytes(), address.as_slice(), &[bump]]];
        let payload = &data[32..];
        let account_list = RawData::deserialize(&mut &*payload)?;
        msg!("{:?}", account_list);
        let transfer_buf:[u8;8] = [0x27, 0xf5 ,0x76, 0xca, 0xfb, 0xb2, 0x63, 0xed];
        let active_buf:[u8;8]=[0x96 , 0x87 , 0x96 , 0x11 , 0x65 , 0x0f , 0x80 , 0xa8];
        let transfer_ins = transfer_buf.to_vec();
        let active_ins = active_buf.to_vec();
        let mut accounts:Vec<AccountMeta>=vec![];
        let mut acc_infos = vec![];
        let mut i  = 0;
        for account in ctx.remaining_accounts {
            let is_signer = account_list.accounts[i].is_signer;
            let writeable = account_list.accounts[i].writeable;
            if writeable {
                accounts.push(AccountMeta::new(account.key(), is_signer));
            } else {
                accounts.push(AccountMeta::new_readonly(account.key(), is_signer));
            }
            acc_infos.push(account.to_account_info());
            i+=1;
            if i == account_list.acc_count as usize{
                break
            }
        }

        let ins: Vec<u8> = account_list.paras.iter().take(8).cloned().collect();
        if ins == transfer_ins {
            // transer
            let bytes:[u8;8] = account_list.paras[8..].try_into().expect("Slice length must be 8");
            let amount = u64::from_le_bytes(bytes);
            let from_pubkey = acc_infos[0].to_account_info();
            let to_pubkey = acc_infos[1].to_account_info();
            msg!("from_pubkey:{:?}", from_pubkey);
            msg!("to_pubkey:{:?}", to_pubkey);
            // **from_pubkey.try_borrow_mut_lamports()? -= amount;
            // **to_pubkey.try_borrow_mut_lamports()? += amount;
            let transfer_instruction = system_instruction::transfer(
                &from_pubkey.key(),
                &to_pubkey.key(),
                amount,
            );
            invoke_signed(
                &transfer_instruction,
                &[
                    from_pubkey.to_account_info(),
                    to_pubkey.to_account_info(),
                ],
                signer_seeds
            )?;
        } else if ins == active_ins {
            let (pda, bump) = Pubkey::find_program_address(&[seeds,&chain.to_le_bytes(), address.as_slice()], ctx.program_id);

            let lamports = (Rent::get()?).minimum_balance(0);

            let create_account_ix = system_instruction::create_account(
                &ctx.accounts.payer.key,
                &pda,
                lamports,
                0,
                &ctx.accounts.system_program.key,
            );

            invoke_signed(
                &create_account_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                    acc_infos[0].to_account_info(),
                ],
                signer_seeds,
            )?;
        } else {
            let instruction: Instruction = Instruction {
                program_id: ctx.accounts.program_account.key(),
                accounts,
                data:account_list.paras.clone(),
            };
            invoke_signed(&instruction, &acc_infos, signer_seeds)?;
        }
        // Done
        Ok(())
    }
}