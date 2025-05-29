module defi_adapter::uni_call_v2 {
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::clock::Clock;
    use std::{vector, option::{Self, Option}, string, bcs};

    use wormhole::publish_message::{Self, prepare_message, publish_message};
    use wormhole::state::State as WormholeState;
    use wormhole::emitter::{Self, EmitterCap};
    use sui::sui::SUI;

    /// 目标链参数配置
    public struct TargetChainPara has copy, drop, store {
        proxy_address: vector<u8>,
        consistency_level: u8,
        delivery_provider: Option<address>,
    }

    /// 主控制器 Shared Object
    public struct UniCall has key, store {
        id: sui::object::UID,
        owner: address,
        chain_id: u16,
        chain_params: vector<(u16, TargetChainPara)>,
        balance: u64,
    }

    public entry fun initialize(
        chain_id: u16,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let obj = UniCall {
            id: sui::object::new(ctx),
            owner,
            chain_id,
            chain_params: vector::empty(),
            balance: 0,
        };
        transfer::share_object(obj);
    }

    /// 设置链参数（只有 owner 可调用）
    public entry fun set_chain_para(
        uni_call: &mut UniCall,
        target_chain: u16,
        proxy_address: vector<u8>,
        consistency_level: u8,
        delivery_provider: Option<address>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == uni_call.owner, 403);
        let new_param = TargetChainPara {
            proxy_address,
            consistency_level,
            delivery_provider,
        };

        let mut i = 0;
        let found = vector::any(&uni_call.chain_params, fun (p: &(u16, TargetChainPara)) { p.0 == target_chain });
        if (found) {
            while (i < vector::length(&uni_call.chain_params)) {
                let (id, _) = vector::borrow(&uni_call.chain_params, i);
                if (*id == target_chain) {
                    vector::borrow_mut(&mut uni_call.chain_params, i).1 = new_param;
                    return;
                };
                i = i + 1;
            }
        } else {
            vector::push_back(&mut uni_call.chain_params, (target_chain, new_param));
        }
    }

    /// 跨链调用入口（公开）
    public entry fun uni_chain_call(
        uni_call: &mut UniCall,
        wormhole_state: &mut WormholeState,
        emitter_cap: &mut EmitterCap,
        mut payment: Coin<SUI>,
        target_chain: u16,
        target_address: vector<u8>,
        payload: vector<u8>,
        receiver_value: u64,
        extra_value: u64,
        gas_limit: vector<u8>,
        the_clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let target_para = get_chain_param(&uni_call.chain_params, target_chain);
        assert!(option::is_some(&target_para), 400);
        let para = option::extract(target_para);

        let sender_bytes = to_bytes32(sender);
        let call_data = bcs::to_bytes(&(sender_bytes, bcs::to_bytes(&(target_address, extra_value, payload))));

        let nonce = 0u32; // TODO: use clock/ctx
        let ticket = prepare_message(emitter_cap, nonce, call_data);
        let _seq = publish_message(wormhole_state, payment, ticket, the_clock);

        event::emit(CrossChainCallEvent {
            source_chain: uni_call.chain_id,
            target_chain,
            target_address,
            payload: call_data,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// 估算跨链费用（模拟）
    public fun quote_cross_chain_cost(
        uni_call: &UniCall,
        target_chain: u16,
        receiver_value: u64,
        gas_limit: vector<u8>
    ): u64 {
        let target_para = get_chain_param(&uni_call.chain_params, target_chain);
        assert!(option::is_some(&target_para), 400);
        let _para = option::extract(target_para);
        // 模拟估价逻辑（实际应对接 relayer 计算）
        1000 + receiver_value + vector::length(&gas_limit) as u64
    }

    /// 提取合约余额（仅限 owner）
    public entry fun donate(
        uni_call: &mut UniCall,
        to: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == uni_call.owner, 403);
        assert!(amount <= uni_call.balance, 401);
        uni_call.balance = uni_call.balance - amount;
        transfer::transfer(SUI { value: amount }, to);
    }

    public fun get_chain_param(params: &vector<(u16, TargetChainPara)>, chain: u16): Option<TargetChainPara> {
        let mut i = 0;
        while (i < vector::length(params)) {
            let (id, cfg) = vector::borrow(params, i);
            if (*id == chain) return option::some(copy *cfg);
            i = i + 1;
        };
        option::none()
    }

    fun to_bytes32(addr: address): vector<u8> {
        let b32 = wormhole::bytes32::from_address(addr);
        wormhole::bytes32::to_bytes(b32)
    }

    /// 跨链事件
    public struct CrossChainCallEvent has copy, drop {
        source_chain: u16,
        target_chain: u16,
        target_address: vector<u8>,
        payload: vector<u8>,
        timestamp: u64,
    }
}
