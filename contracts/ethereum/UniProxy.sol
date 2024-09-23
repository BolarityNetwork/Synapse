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
	// mapping   ChainId+wormholeAddress -> address  (AddressMapping)
	mapping(uint16 => mapping(bytes32 => address)) public proxys;
	mapping(uint16 => bytes32) public registeredSenders;
	mapping(bytes32 => bool) consumedMessages;
	
	event ProxyCreated(uint16 indexed sourceChain, bytes32 indexed sourceAddress, address proxy);
	
	constructor(address _wormholeCore) {
        wormholeCore = _wormholeCore;
        registrationOwner = msg.sender;
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

        if(registeredSenders[sourceChain] == sourceAddress){
            (sAddress, sPayload) = abi.decode(payload, (bytes32, bytes));
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
            emit ProxyCreated(sChain, sAddress, proxy);
        }

        IEvmProxy(proxy).doProxy{value: msg.value}(sPayload);
	}

}