export const RELAYER_HUB_PID = process.env.RELAYER_HUB_PID!;

export const RELAYER_SOLANA_SECRET = process.env.RELAYER_SOLANA_SECRET!;
export const RELAYER_SEPOLIA_SECRET = process.env.RELAYER_SEPOLIA_SECRET!;

export const SOLANA_RPC = process.env.SOLANA_RPC!;
export const SEPOLIA_RPC = process.env.SEPOLIA_RPC!;

export const RELAYER_SOLANA_PROGRAM = process.env.RELAYER_SOLANA_PROGRAM!;
export const RELAYER_SEPOLIA_PROGRAM = process.env.RELAYER_SEPOLIA_PROGRAM!;
export const CROSS_SECRET = process.env.CROSS_SECRET!;

export const CHAIN_WORKER_FILE = process.env.CHAIN_WORKER_FILE!;
export const MESSAGE_WORKER_FILE = process.env.MESSAGE_WORKER_FILE!;
export const MAX_THREAD:number = Number(process.env.MAX_THREAD!);
export const RELAYER_SEPOLIA_SECRET_LIST:string[] = process.env.RELAYER_SEPOLIA_SECRET_LIST ? process.env.RELAYER_SEPOLIA_SECRET_LIST.split(',') : [];
export const WORMHOLE_NETWORK= process.env.WORMHOLE_NETWORK!;
export const WORMHOLE_ENVIRONMENT = process.env.WORMHOLE_ENVIRONMENT!;
// program IDs
export const TOKEN_BRIDGE_RELAYER_SOLANA_PID = process.env.TOKEN_BRIDGE_RELAYER_SOLANA_PID!;
export const CORE_BRIDGE_PID = process.env.CORE_BRIDGE_PID!;
export const TOKEN_BRIDGE_SOLANA_PID = process.env.TOKEN_BRIDGE_SOLANA_PID!;
export const TOKEN_BRIDGE_SEPOLIA_PID= process.env.TOKEN_BRIDGE_SEPOLIA_PID!;
export const SOL_MINT =  "So11111111111111111111111111111111111111112";


export const RELAYER_INFO_SEED="relayer_info";

export const RELAYER_SEED="relayer";

export const POOL_SEED="pool";

export const CONFIG_SEED="config";

export const TX_SEED="tx";

export const EPOCH_SEQUENCE_SEED="epoch_sequence";

export const FINAL_TX_SEED="final_tx";