// This file is part of Synapse.

// Copyright (C) BolarityNetwork
// SPDX-License-Identifier: Apache 2

pragma solidity ^0.8.0;

import './interfaces/IEvmProxy.sol';
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract EvmProxy is IEvmProxy, IERC721Receiver {
	address public factory;
	uint16 public sourceChain;
	bytes32 public sourceAddress;

	constructor() {
		factory = msg.sender;
	}
	
	function initialize(uint16 _sourceChain, bytes32 _sourceAddress) external override {
		require(msg.sender == factory, 'EvmProxy: Forbidden');
		sourceChain = _sourceChain;
		sourceAddress = _sourceAddress;
	}
	
	function doProxy(bytes memory payload) external payable override {
		require(msg.sender == factory, 'EvmProxy: Forbidden');
		(bytes32 uniAddress, uint extraValue, bytes memory paraWithSelector) = abi.decode(payload, (bytes32, uint256, bytes));
		address payable target = payable(fromUniAddress(uniAddress));
		(bool result, ) =  target.call{value: msg.value+extraValue}(paraWithSelector);
		require(result, 'EvmProxy: CallFail');
	}
	
	function fromUniAddress(bytes32 uniAddress) public pure returns (address addr) {
		require(bytes12(uniAddress) == 0, 'FromUniAddress: Not EVM address');
		assembly {
			addr := uniAddress
		}
	}
	receive() external payable {}

	function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
		return IERC721Receiver.onERC721Received.selector;
	}
}