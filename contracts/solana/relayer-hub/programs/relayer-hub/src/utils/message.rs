use anchor_lang::prelude::*;
use wormhole_anchor_sdk::wormhole::{self, program::Wormhole};
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct AccountMetaType {
    pub key: Pubkey,
    pub writeable: bool,
    pub is_signer: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct RawData {
    pub chain_id: u16,
    pub caller: Pubkey,
    pub programId: Pubkey,
    pub acc_count: u8,
    pub accounts: Vec<AccountMetaType>,
    pub paras: Vec<u8>,
    pub acc_meta: Vec<u8>,
}
pub type SolanaVaa = wormhole::PostedVaa<RawData>;

#[cfg(test)]
mod test {
    use wormhole_raw_vaas::token_bridge::TokenBridgePayload;
    use super::*;

    #[test]
    fn test_vaa_deserialize() -> Result<()> {
        let vaa_bytes:&[u8] =
            &hex_literal::hex!["010000000001002a5d283a7c37d93184a693a612a41278559a7ddbe446bd4e5fc92024135d719b3d4a9ca5ca150fa256edb3280a9b58c70c2c62ae87511188078b2b3216b1928901676e11ff0000000000013b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98000000000000758b20010000000000000000000000000000000000000000000000000000000000989680069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f000000000010001e8de75ef9e847ee05ed3d828e307b24c427e55b918ba81de3c0ae12570284afb00150000000000000000000000000000000000000000000000000000000000000000"];
        let raw_vaa = wormhole_raw_vaas::Vaa::parse(vaa_bytes).unwrap();

        assert_eq!(raw_vaa.version(), 1);
        assert_eq!(raw_vaa.guardian_set_index(), 0);
        assert_eq!(raw_vaa.signature_count(), 1);

        let payload = TokenBridgePayload::try_from(raw_vaa.payload()).unwrap().message();
        let transfer = payload.transfer().unwrap();
        assert_eq!(transfer.recipient_chain(), 21);
        assert_eq!(transfer.recipient(), hex_literal::hex!["e8de75ef9e847ee05ed3d828e307b24c427e55b918ba81de3c0ae12570284afb"]);
        Ok(())
    }
}