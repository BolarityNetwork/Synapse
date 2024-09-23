// This file is part of Synapse.

// Copyright (C) BolarityNetwork
// SPDX-License-Identifier: Apache 2

pragma solidity ^0.8.0;

import './interfaces/IWormholeRelayer.sol';

contract UniProxy {
	uint16 constant ThisChainId = 2;
	IWormholeRelayer public wormholeRelayer;
	
	//Ethereum address: 0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B
	constructor(address _wormholeRelayer) {
		wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
	}
	
	function uniChainCall(
		uint16 targetChain,
		bytes32 proxyAddress,
		bytes32 targetAddress,
		bytes memory payload,
		uint receiverValue,
		uint extraValue,
		bytes memory gaslimit,
		uint8 consistencyLevel
	) external payable {
		address delivery = wormholeRelayer.getDefaultDeliveryProvider();
		(uint256 cost, ) = wormholeRelayer.quoteDeliveryPrice(targetChain, receiverValue, gaslimit, delivery);

		require(
			msg.value >= cost,
			"Insufficient funds for cross-chain delivery"
		);

		wormholeRelayer.send{value: cost}(
			targetChain,
			proxyAddress,
			abi.encode(toUniAddress(msg.sender), abi.encode(targetAddress, extraValue, payload)),
			receiverValue,
			0,
			gaslimit,
			ThisChainId,
			toUniAddress(msg.sender),
			delivery,
			new MessageKey[](0),
			consistencyLevel
		);
	}
	
	function toUniAddress(address addr) public pure returns (bytes32 uniAddress) {
		uniAddress = bytes32(uint256(uint160(addr)));
	}
}