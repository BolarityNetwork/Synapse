#[repr(u8)]
pub enum Discriminators {
    // Configs
    Config = 0x01,
    VaultRegistry = 0x02,

    WeightTable = 0x03,
    EpochSnapshot = 0x04,
    OperatorSnapshot = 0x05,
}
