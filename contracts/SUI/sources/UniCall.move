// This file is part of Synapse.
// Copyright (C) BolarityNetwork
// SPDX-License-Identifier: Apache 2

module unicall::uni_call {
    use std::vector;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::bcs;
    use sui::clock::{Clock};
    
    // Wormhole imports - 基于官方接口
    use wormhole::emitter::{Self, EmitterCap};
    use wormhole::state::{State as WormholeState};
    use wormhole::publish_message::{prepare_message, publish_message};

    /// 错误码
    const E_NOT_OWNER: u64 = 1;
    const E_TARGET_CHAIN_NOT_SET: u64 = 2;
    const E_INSUFFICIENT_FUNDS: u64 = 3;

    /// 对应 Solidity 的 TargetChainPara 结构体
    struct TargetChainPara has store, copy, drop {
        proxy_address: vector<u8>,      // bytes32 proxyAddress
        consistency_level: u8,          // uint8 consistencyLevel  
        delivery_provider: vector<u8>,  // address deliveryProvider
    }

    /// 主合约对象 - 对应 Solidity 的 UniCall 合约
    struct UniCall has key {
        id: UID,
        owner: address,                                    // address owner
        this_chain_id: u16,                               // uint16 thisChainId
        wormhole_relayer: EmitterCap,                     // 替代 IWormholeRelayer
        target_chain_paras: Table<u16, TargetChainPara>, // mapping(uint16 => TargetChainPara)
        balance: Balance<SUI>,                            // 用于存储合约资金
    }

    /// 构造函数 - 对应 Solidity constructor
    public fun init_contract(
        wormhole_state: &WormholeState,
        _this_chain_id: u16,
        ctx: &mut TxContext
    ) {
        let uni_call = UniCall {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),               // owner = msg.sender
            this_chain_id: _this_chain_id,                // thisChainId = _thisChainId
            wormhole_relayer: emitter::new(wormhole_state, ctx), // wormholeRelayer = IWormholeRelayer(_wormholeRelayer)
            target_chain_paras: table::new(ctx),
            balance: balance::zero(),
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

    /// uniChainCall 函数 - 对应 Solidity 主要功能
    public entry fun uni_chain_call(
        uni_call: &mut UniCall,
        wormhole_state: &mut WormholeState,
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

        // 简化的成本计算 - 对应 Solidity 的 quoteDeliveryPrice 逻辑
        let cost = quote_cross_chain_cost_internal(target_chain, receiver_value, &gas_limit, target_para);
        
        // require(msg.value >= cost, "Insufficient funds for cross-chain delivery");
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= cost, E_INSUFFICIENT_FUNDS);

        // 将支付加入合约余额
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut uni_call.balance, payment_balance);

        // 构造消息载荷 - 对应 Solidity 的 abi.encode 逻辑
        let sender_uni_address = to_uni_address(tx_context::sender(ctx));
        let encoded_payload = encode_wormhole_payload(
            sender_uni_address,
            target_address,
            extra_value,
            payload
        );

        // 发送 Wormhole 消息 - 对应 Solidity 的 wormholeRelayer.send
        let message = prepare_message(
            &mut uni_call.wormhole_relayer,
            0, // nonce - 对应 Solidity 的固定值
            encoded_payload
        );

        publish_message(
            wormhole_state,
            coin::zero(ctx), // message fee
            message,
            the_clock
        );
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
        let inner_encoded = vector::empty<u8>();
        vector::append(&mut inner_encoded, target_address);
        vector::append(&mut inner_encoded, bcs::to_bytes(&extra_value));
        vector::append(&mut inner_encoded, payload);
        
        let final_encoded = vector::empty<u8>();
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

    // =================== 测试代码 ===================

    #[test_only]
    use sui::test_scenario;
    #[test_only]
    use wormhole::wormhole_scenario::{
        return_clock,
        return_state,
        set_up_wormhole,
        take_clock,
        take_state,
        two_people,
    };

    #[test]
    fun test_solidity_replica() {
        let (user, admin) = two_people();
        let my_scenario = test_scenario::begin(admin);
        let scenario = &mut my_scenario;

        // 设置 Wormhole 环境
        set_up_wormhole(scenario, 0);

        // 构造函数测试
        test_scenario::next_tx(scenario, admin);
        {
            let wormhole_state = take_state(scenario);
            init_contract(&wormhole_state, 21, test_scenario::ctx(scenario)); // Sui chain ID
            return_state(wormhole_state);
        };

        // setChainPara 测试 - 对应 Ethereum (address: 0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B, chainId:2)
        test_scenario::next_tx(scenario, admin);
        {
            let uni_call = test_scenario::take_shared<UniCall>(scenario);
            
            let ethereum_proxy = vector[
                0x98, 0xf3, 0xc9, 0xe6, 0xE3, 0xfA, 0xce, 0x36,
                0xbA, 0xAd, 0x05, 0xFE, 0x09, 0xd3, 0x75, 0xEf,
                0x14, 0x64, 0x28, 0x8B, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ];
            
            set_chain_para(
                &mut uni_call,
                2, // Ethereum chainId
                ethereum_proxy,
                15, // consistencyLevel
                vector::empty(), // deliveryProvider (空表示使用默认)
                test_scenario::ctx(scenario)
            );
            
            // 验证设置成功
            let (proxy, consistency, _) = get_target_chain_para(&uni_call, 2);
            assert!(proxy == ethereum_proxy, 0);
            assert!(consistency == 15, 1);
            
            test_scenario::return_shared(uni_call);
        };

        // quoteCrossChainCost 测试
        test_scenario::next_tx(scenario, user);
        {
            let uni_call = test_scenario::take_shared<UniCall>(scenario);
            
            let cost = quote_cross_chain_cost(
                &uni_call,
                2, // target chain
                1000000, // receiver value
                vector[0x01, 0x02], // gas limit
            );
            
            assert!(cost > 0, 2);
            
            test_scenario::return_shared(uni_call);
        };

        // uniChainCall 测试
        test_scenario::next_tx(scenario, user);
        {
            let uni_call = test_scenario::take_shared<UniCall>(scenario);
            let wormhole_state = take_state(scenario);
            let the_clock = take_clock(scenario);
            
            // 创建足够的支付
            let payment = coin::mint_for_testing<SUI>(10000000, test_scenario::ctx(scenario)); // 0.01 SUI
            
            uni_chain_call(
                &mut uni_call,
                &mut wormhole_state,
                2, // Ethereum
                vector[0xab, 0xcd, 0xef], // target address
                b"test payload", // payload
                1000000, // receiver value  
                500000,  // extra value
                vector[0x01, 0x02], // gas limit
                payment,
                &the_clock,
                test_scenario::ctx(scenario)
            );
            
            // 验证余额增加
            assert!(get_balance(&uni_call) > 0, 3);
            
            test_scenario::return_shared(uni_call);
            return_state(wormhole_state);
            return_clock(the_clock);
        };

        test_scenario::end(my_scenario);
    }
}