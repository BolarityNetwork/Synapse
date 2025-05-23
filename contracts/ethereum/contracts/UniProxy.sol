// This file is part of Synapse.

// Copyright (C) BolarityNetwork
// SPDX-License-Identifier: Apache 2

pragma solidity ^0.8.0;

import './interfaces/IWormhole.sol';
import './interfaces/IWormholeReceiver.sol';
import './interfaces/IEvmProxy.sol';
import './EvmProxy.sol';

contract UniProxy is IWormholeReceiver {
	address public wormholeCore;
	address public registrationOwner;
	uint8 public wormholeFinality;
	// mapping   ChainId+wormholeAddress -> address  (AddressMapping)
	mapping(uint16 => mapping(bytes32 => address)) public proxys;
	mapping(uint16 => mapping(address => bytes32)) public reverseProxys;
	mapping(uint16 => bytes32) public registeredSenders;
	mapping(bytes32 => bool) consumedMessages;
	
	event ProxyCreated(uint16 indexed sourceChain, bytes32 indexed sourceAddress, address proxy);
	
	constructor(address _wormholeCore, uint8 wormholeFinality_) {
		wormholeCore = _wormholeCore;
		registrationOwner = msg.sender;
		wormholeFinality = wormholeFinality_;
	}
	
	function setRegisteredSender(
		uint16 sourceChain,
		bytes32 sourceAddress
	) public {
		require(
			msg.sender == registrationOwner,
			"Not registrationOwner"
		);
		registeredSenders[sourceChain] = sourceAddress;
	}
	
	//receive message for not EVM emitter chain
	function receiveMessage(bytes memory encodedMessage) public {
		(
			IWormhole.VM memory wormholeMessage,
			bool valid,
			string memory reason
		) = IWormhole(wormholeCore).parseAndVerifyVM(encodedMessage);

		require(valid, reason);

		_receiveMessages(
			wormholeMessage.payload,
			new bytes[](0),
			wormholeMessage.emitterAddress,
			wormholeMessage.emitterChainId,
			wormholeMessage.hash
		);
	}

	function receiveWormholeMessages(
		bytes memory payload,
		bytes[] memory additionalVaas,
		bytes32 sourceAddress,
		uint16 sourceChain,
		bytes32 deliveryHash
	) external payable override {
		require(msg.sender == wormholeCore, 'Not wormhole core call');
		_receiveMessages(payload, additionalVaas, sourceAddress, sourceChain, deliveryHash);
	}
	
	function _receiveMessages(
		bytes memory payload,
		bytes[] memory additionalVaas,
		bytes32 sourceAddress,
		uint16 sourceChain,
		bytes32 deliveryHash
	) private {
		require(!consumedMessages[deliveryHash], "message already consumed");
		consumedMessages[deliveryHash] = true;

		uint16 sChain = sourceChain;
		bytes32 sAddress = sourceAddress;
		bytes memory sPayload = payload;
		bytes8 sHead;

		if(registeredSenders[sourceChain] == sourceAddress){
			(sHead, sAddress, sPayload) = abi.decode(payload, (bytes8, bytes32, bytes));
		}

		address proxy = proxys[sChain][sAddress];
		if(proxy == address(0)) {
			bytes memory bytecode = type(EvmProxy).creationCode;
			bytes32 salt = keccak256(abi.encodePacked(sChain, sAddress));
			assembly {
				proxy := create2(0, add(bytecode, 32), mload(bytecode), salt)
			}
			IEvmProxy(proxy).initialize(sChain, sAddress);
			proxys[sChain][sAddress] = proxy;
			reverseProxys[sChain][proxy] = sAddress;
			emit ProxyCreated(sChain, sAddress, proxy);
		} else {
			IEvmProxy(proxy).doProxy{value: msg.value}(sPayload);
		}
	}

    function sendMessage(
        bytes memory helloWorldMessage
    ) public payable returns (uint64 messageSequence) {

        // cache Wormhole instance and fees to save on gas
        IWormhole wormhole = IWormhole(wormholeCore);
        uint256 wormholeFee = wormhole.messageFee();

        // Confirm that the caller has sent enough value to pay for the Wormhole
        // message fee.
        require(msg.value == wormholeFee, "insufficient value");

        // Send the HelloWorld message by calling publishMessage on the
        // Wormhole core contract and paying the Wormhole protocol fee.
        messageSequence = wormhole.publishMessage{value: wormholeFee}(
            0, // batchID
            helloWorldMessage,
            wormholeFinality
        );
    }

	function getReverseAddress(
		uint16 sourceChain,
		address sourceAddress) external view returns (bytes32) {
		return reverseProxys[sourceChain][sourceAddress];
	}

}