// This file is part of Synapse.

// Copyright (C) BolarityNetwork
// SPDX-License-Identifier: Apache 2

pragma solidity ^0.8.0;

import './interfaces/IWormholeRelayer.sol';

contract UniCall {
	struct TargetChainPara{
		bytes32 proxyAddress;
		uint8 consistencyLevel;
		address deliveryProvider;
	}

	address owner;
	uint16 thisChainId;
	IWormholeRelayer public wormholeRelayer;
	mapping(uint16 => TargetChainPara) public targetChainParas;
	
	
	//Ethereum (address: 0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B, chainId:2)
	//Others(...)
	constructor(address _wormholeRelayer, uint16 _thisChainId) {
		wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
		thisChainId = _thisChainId;
		owner = msg.sender;
	}
	
	function setChainPara(
		uint16 targetChain,
		bytes32 proxyAddress,
		uint8 consistencyLevel,
		address deliveryProvider		
	) public {
		require(msg.sender == owner, "Not the contract owner");
		targetChainParas[targetChain] = TargetChainPara(proxyAddress, consistencyLevel, deliveryProvider);
	}
	
	function uniChainCall(
		uint16 targetChain,
		bytes32 targetAddress,
		bytes memory payload,
		uint receiverValue,
		uint extraValue,
		bytes memory gaslimit
	) external payable {
		TargetChainPara memory targetPara = targetChainParas[targetChain];
		require(targetPara.proxyAddress != bytes32(0), "Set target chain parameter first");
		
		address delivery = targetPara.deliveryProvider;
		if(delivery == address(0))
			delivery = wormholeRelayer.getDefaultDeliveryProvider();
		(uint cost, ) = wormholeRelayer.quoteDeliveryPrice(targetChain, receiverValue, gaslimit, delivery);	

		require(
			msg.value >= cost,
			"Insufficient funds for cross-chain delivery"
		);

		wormholeRelayer.send{value: cost}(
			targetChain,
			targetPara.proxyAddress,
			abi.encode(toUniAddress(msg.sender), abi.encode(targetAddress, extraValue, payload)),
			receiverValue,
			0,
			gaslimit,
			thisChainId,
			toUniAddress(msg.sender),
			delivery,
			new MessageKey[](0),
			targetPara.consistencyLevel
		);
	}
	
	function toUniAddress(address addr) public pure returns (bytes32 uniAddress) {
		uniAddress = bytes32(uint256(uint160(addr)));
	}
	
	function quoteCrossChainCost(
		uint16 targetChain,
		uint receiverValue,
		bytes memory gaslimit
	) public view returns(uint cost) {
		TargetChainPara memory targetPara = targetChainParas[targetChain];
		require(targetPara.proxyAddress != bytes32(0), "Set target chain parameter first");
		
		address delivery = targetPara.deliveryProvider;
		if(delivery == address(0))
			delivery = wormholeRelayer.getDefaultDeliveryProvider();
			
		(cost, ) = wormholeRelayer.quoteDeliveryPrice(targetChain, receiverValue, gaslimit, delivery);	
	}
	
	function getDonate(address payable to, uint amount) external {
		require(msg.sender == owner, "Not the contract owner");
		to.transfer(amount);
	}
}