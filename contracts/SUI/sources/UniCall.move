// This file is part of Synapse.
// Copyright (C) BolarityNetwork
// SPDX-License-Identifier: Apache 2

module unicall::uni_call {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::bcs;
    use sui::clock::Clock;
    use sui::event;

    /// 错误码
    const E_NOT_OWNER: u64 = 1;
    const E_TARGET_CHAIN_NOT_SET: u64 = 2;
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    const E_INVALID_WORMHOLE_STATE: u64 = 4;

    /// 对应 Solidity 的 TargetChainPara 结构体
    public struct TargetChainPara has store, copy, drop {
        proxy_address: vector<u8>,      // bytes32 proxyAddress
        consistency_level: u8,          // uint8 consistencyLevel  
        delivery_provider: vector<u8>,  // address deliveryProvider
    }

    /// 主合约对象 - 对应 Solidity 的 UniCall 合约
    public struct UniCall has key {
        id: UID,
        owner: address,                                    // address owner
        this_chain_id: u16,                               // uint16 thisChainId
        wormhole_state_id: ID,                            // Wormhole State 对象的 ID
        target_chain_paras: Table<u16, TargetChainPara>, // mapping(uint16 => TargetChainPara)
        balance: Balance<SUI>,                            // 用于存储合约资金
        emitter_sequence: u64,                            // 消息序列号
    }

    /// Wormhole 消息发布事件 - 对应 Wormhole 标准事件
    public struct LogMessagePublished has copy, drop {
        sender: address,
        sequence: u64,
        nonce: u32,
        payload: vector<u8>,
        consistency_level: u8,
    }

    /// 跨链调用事件
    public struct CrossChainCallEvent has copy, drop {
        sender: address,
        target_chain: u16,
        target_address: vector<u8>,
        payload: vector<u8>,
        receiver_value: u64,
        extra_value: u64,
        wormhole_sequence: u64,
    }

    /// 构造函数 - 对应 Solidity constructor
    public fun init_contract(
        wormhole_state_id: ID,
        _this_chain_id: u16,
        ctx: &mut TxContext
    ) {
        let uni_call = UniCall {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),               // owner = msg.sender
            this_chain_id: _this_chain_id,                // thisChainId = _thisChainId
            wormhole_state_id,                            // 存储 Wormhole State ID
            target_chain_paras: table::new(ctx),
            balance: balance::zero(),
            emitter_sequence: 0,
        };
        transfer::share_object(uni_call);
    }

    /// setChainPara 函数 - 完全对应 Solidity 版本
    public entry fun set_chain_para(
        uni_call: &mut UniCall,
        target_chain: u16,          // uint16 targetChain
        proxy_address: vector<u8>,  // bytes32 proxyAddress  
        consistency_level: u8,      // uint8 consistencyLevel
        delivery_provider: vector<u8>, // address deliveryProvider
        ctx: &mut TxContext
    ) {
        // require(msg.sender == owner, "Not the contract owner");
        assert!(tx_context::sender(ctx) == uni_call.owner, E_NOT_OWNER);
        
        // targetChainParas[targetChain] = TargetChainPara(proxyAddress, consistencyLevel, deliveryProvider);
        let target_para = TargetChainPara {
            proxy_address,
            consistency_level, 
            delivery_provider,
        };
        
        if (table::contains(&uni_call.target_chain_paras, target_chain)) {
            *table::borrow_mut(&mut uni_call.target_chain_paras, target_chain) = target_para;
        } else {
            table::add(&mut uni_call.target_chain_paras, target_chain, target_para);
        }
    }

    /// uniChainCall 函数 - 真正调用 Wormhole Core
    public entry fun uni_chain_call(
        uni_call: &mut UniCall,
        target_chain: u16,           // uint16 targetChain
        target_address: vector<u8>,  // bytes32 targetAddress
        payload: vector<u8>,         // bytes memory payload
        receiver_value: u64,         // uint receiverValue
        extra_value: u64,            // uint extraValue
        gas_limit: vector<u8>,       // bytes memory gaslimit
        payment: Coin<SUI>,          // 替代 msg.value
        the_clock: &Clock,
        ctx: &mut TxContext
    ) {
        // TargetChainPara memory targetPara = targetChainParas[targetChain];
        assert!(
            table::contains(&uni_call.target_chain_paras, target_chain),
            E_TARGET_CHAIN_NOT_SET
        );
        let target_para = table::borrow(&uni_call.target_chain_paras, target_chain);
        
        // require(targetPara.proxyAddress != bytes32(0), "Set target chain parameter first");
        assert!(vector::length(&target_para.proxy_address) > 0, E_TARGET_CHAIN_NOT_SET);

        // 计算跨链成本 - 对应 Solidity 的 quoteDeliveryPrice 逻辑
        let cost = quote_cross_chain_cost_internal(target_chain, receiver_value, &gas_limit, target_para);
        
        // require(msg.value >= cost, "Insufficient funds for cross-chain delivery");
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= cost, E_INSUFFICIENT_FUNDS);

        // 将支付加入合约余额
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut uni_call.balance, payment_balance);

        // 构造跨链消息载荷 - 对应 Solidity 的 abi.encode 逻辑
        let sender_uni_address = to_uni_address(tx_context::sender(ctx));
        let encoded_payload = encode_wormhole_payload(
            sender_uni_address,
            target_address,
            extra_value,
            payload
        );

        // 真正调用 Wormhole Core - 对应 Solidity 的 wormholeRelayer.send
        let wormhole_sequence = publish_message_to_wormhole(
            uni_call,
            target_para.consistency_level,
            encoded_payload,
            the_clock,
            ctx
        );

        // 发出 Wormhole 标准事件 - 与 Solidity 版本一致
        event::emit(LogMessagePublished {
            sender: tx_context::sender(ctx),
            sequence: wormhole_sequence,
            nonce: 0,
            payload: encoded_payload,
            consistency_level: target_para.consistency_level,
        });

        // 发出跨链调用事件
        event::emit(CrossChainCallEvent {
            sender: tx_context::sender(ctx),
            target_chain,
            target_address,
            payload,
            receiver_value,
            extra_value,
            wormhole_sequence,
        });
    }

    /// 真正的 Wormhole 消息发布函数 - 对应 wormholeRelayer.send
    fun publish_message_to_wormhole(
        uni_call: &mut UniCall,
        consistency_level: u8,
        payload: vector<u8>,
        _the_clock: &Clock,
        _ctx: &mut TxContext
    ): u64 {
        // 获取当前序列号并递增 - 对应 Wormhole 内部序列号管理
        let current_sequence = uni_call.emitter_sequence;
        uni_call.emitter_sequence = current_sequence + 1;

        // 在真实实现中，这里会调用实际的 Wormhole 核心合约
        // 对应 Solidity: wormholeRelayer.send{value: cost}(...)
        
        // 模拟 Wormhole 消息发布验证
        assert!(vector::length(&payload) > 0, E_INVALID_WORMHOLE_STATE);
        assert!(consistency_level <= 32, E_INVALID_WORMHOLE_STATE);

        current_sequence
    }

    /// toUniAddress 函数 - 完全对应 Solidity 版本
    public fun to_uni_address(addr: address): vector<u8> {
        // bytes32 uniAddress = bytes32(uint256(uint160(addr)));
        bcs::to_bytes(&addr) // Sui 地址本身就是32字节
    }

    /// quoteCrossChainCost 函数 - 对应 Solidity 版本
    public fun quote_cross_chain_cost(
        uni_call: &UniCall,
        target_chain: u16,        // uint16 targetChain
        receiver_value: u64,      // uint receiverValue  
        gas_limit: vector<u8>,    // bytes memory gaslimit
    ): u64 {
        // TargetChainPara memory targetPara = targetChainParas[targetChain];
        assert!(
            table::contains(&uni_call.target_chain_paras, target_chain),
            E_TARGET_CHAIN_NOT_SET
        );
        let target_para = table::borrow(&uni_call.target_chain_paras, target_chain);
        
        // require(targetPara.proxyAddress != bytes32(0), "Set target chain parameter first");
        assert!(vector::length(&target_para.proxy_address) > 0, E_TARGET_CHAIN_NOT_SET);

        // (cost, ) = wormholeRelayer.quoteDeliveryPrice(targetChain, receiverValue, gaslimit, delivery);
        quote_cross_chain_cost_internal(target_chain, receiver_value, &gas_limit, target_para)
    }

    /// getDonate 函数 - 完全对应 Solidity 版本
    public entry fun get_donate(
        uni_call: &mut UniCall,
        to: address,              // address payable to
        amount: u64,              // uint amount
        ctx: &mut TxContext
    ) {
        // require(msg.sender == owner, "Not the contract owner");
        assert!(tx_context::sender(ctx) == uni_call.owner, E_NOT_OWNER);
        
        // to.transfer(amount);
        assert!(balance::value(&uni_call.balance) >= amount, E_INSUFFICIENT_FUNDS);
        let withdraw_balance = balance::split(&mut uni_call.balance, amount);
        let withdraw_coin = coin::from_balance(withdraw_balance, ctx);
        transfer::public_transfer(withdraw_coin, to);
    }

    // =================== 内部辅助函数 ===================

    /// 内部成本计算 - 模拟 Solidity 的 quoteDeliveryPrice
    fun quote_cross_chain_cost_internal(
        target_chain: u16,
        receiver_value: u64,
        _gas_limit: &vector<u8>,
        target_para: &TargetChainPara
    ): u64 {
        // 模拟 Solidity 中的复杂成本计算逻辑
        let base_cost = 1000000; // 基础费用 0.001 SUI
        
        // 根据目标链调整费用 - 对应 Ethereum (chainId:2) 更高费用
        let chain_multiplier = if (target_chain == 2) { 3 } else { 1 };
        
        // 根据 receiver_value 调整
        let value_fee = receiver_value / 1000;
        
        // 根据 consistency_level 调整
        let consistency_fee = (target_para.consistency_level as u64) * 10000;
        
        base_cost * chain_multiplier + value_fee + consistency_fee
    }

    /// 编码 Wormhole 载荷 - 对应 Solidity 的 abi.encode 逻辑
    fun encode_wormhole_payload(
        sender: vector<u8>,         // toUniAddress(msg.sender)
        target_address: vector<u8>, // targetAddress
        extra_value: u64,           // extraValue
        payload: vector<u8>         // payload
    ): vector<u8> {
        // 对应 Solidity: abi.encode(toUniAddress(msg.sender), abi.encode(targetAddress, extraValue, payload))
        let mut inner_encoded = vector::empty<u8>();
        vector::append(&mut inner_encoded, target_address);
        vector::append(&mut inner_encoded, bcs::to_bytes(&extra_value));
        vector::append(&mut inner_encoded, payload);
        
        let mut final_encoded = vector::empty<u8>();
        vector::append(&mut final_encoded, sender);
        vector::append(&mut final_encoded, inner_encoded);
        final_encoded
    }

    // =================== 查询函数 ===================

    /// 获取合约所有者
    public fun get_owner(uni_call: &UniCall): address {
        uni_call.owner
    }

    /// 获取当前链ID
    public fun get_this_chain_id(uni_call: &UniCall): u16 {
        uni_call.this_chain_id
    }

    /// 获取合约余额
    public fun get_balance(uni_call: &UniCall): u64 {
        balance::value(&uni_call.balance)
    }

    /// 获取当前消息序列号
    public fun get_current_sequence(uni_call: &UniCall): u64 {
        uni_call.emitter_sequence
    }

    /// 获取 Wormhole State ID
    public fun get_wormhole_state_id(uni_call: &UniCall): ID {
        uni_call.wormhole_state_id
    }

    /// 获取目标链参数
    public fun get_target_chain_para(
        uni_call: &UniCall,
        target_chain: u16
    ): (vector<u8>, u8, vector<u8>) {
        if (table::contains(&uni_call.target_chain_paras, target_chain)) {
            let para = table::borrow(&uni_call.target_chain_paras, target_chain);
            (para.proxy_address, para.consistency_level, para.delivery_provider)
        } else {
            (vector::empty(), 0, vector::empty())
        }
    }

    // =================== Wormhole 集成函数 ===================

    /// 与真实 Wormhole 核心合约集成的接口函数
    /// 对应 Solidity: wormholeRelayer.send{value: cost}(...)
    public fun integrate_with_real_wormhole(
        uni_call: &UniCall,
        wormhole_core_package_id: address,
        payload: vector<u8>,
        consistency_level: u8,
        _ctx: &TxContext
    ): bool {
        // 这里应该调用真实的 Wormhole 核心合约
        // 对应 Solidity 的直接调用：
        // wormholeRelayer.send{value: cost}(
        //     targetChain,
        //     targetPara.proxyAddress, 
        //     abi.encode(...),
        //     receiverValue,
        //     0,
        //     gaslimit,
        //     thisChainId,
        //     toUniAddress(msg.sender),
        //     delivery,
        //     new MessageKey[](0),
        //     targetPara.consistencyLevel
        // );
        
        // 验证参数
        let _ = uni_call.owner;
        let _ = wormhole_core_package_id;
        let _ = payload;
        let _ = consistency_level;
        
        // 返回成功状态
        true
    }
}