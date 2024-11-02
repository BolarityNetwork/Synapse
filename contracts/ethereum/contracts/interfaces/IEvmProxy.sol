// This file is part of Synapse.

// Copyright (C) BolarityNetwork
// SPDX-License-Identifier: Apache 2

pragma solidity ^0.8.0;

interface IEvmProxy {
	function initialize(uint16 _sourceChain, bytes32 _sourceAddress) external;
	function doProxy(bytes memory payload) external payable;
}