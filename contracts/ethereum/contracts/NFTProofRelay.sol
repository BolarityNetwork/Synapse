// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ISendMessage
 * @dev Interface for interacting with the Wormhole bridge protocol
 */
interface ISendMessage {
    function sendMessage(
        bytes memory helloWorldMessage
    ) external payable returns (uint64 sequence);
}

interface IUniProxy {
    function getReverseAddress(
        uint16 sourceChain,
        address sourceAddress) external view returns (bytes32);
}
/**
 * @title NFTProofRelay
 * @dev Contract for relaying NFT ownership proofs from Ethereum to Solana via Wormhole
 */
contract NFTProofRelay is Ownable, ReentrancyGuard, Pausable {
    /// @notice Wormhole message sender contract address
    address public msgSenderAddress;

    address public uniProxyAddress;
    /// @notice Fee required to cover Wormhole message costs
    uint256 public wormholeFee;

    /// @notice Mapping to store approved NFT contracts
    mapping(address => bool) public approvedNFTContracts;

    /// @notice Mapping to track if a token has been relayed (prevent replay attacks)
    mapping(address => mapping(uint256 => bool)) public tokenRelayed;

    /// @notice List of all approved NFT contracts for easier off-chain querying
    address[] public approvedNFTList;

    // Events
    event NFTProofSubmitted(
        address indexed proxyAccount,
        address indexed nftContract,
        uint256 indexed tokenId,
//        bytes32 solanaReceiver,
        uint64 sequence
    );

    event ApprovedNFTContractUpdated(
        address indexed nftContract,
        bool status
    );

    event WormholeAddressUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );

    event UniProxyAddressUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );

    event ConsistencyLevelUpdated(
        uint8 oldLevel,
        uint8 newLevel
    );

    event WormholeFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );

    /**
     * @dev Modifier to check if an NFT contract is approved
     * @param nftContract The address of the NFT contract to check
     */
    modifier onlyApprovedNFT(address nftContract) {
        require(approvedNFTContracts[nftContract], "NFTProofRelay: NFT contract not approved");
        _;
    }

    /**
     * @dev Constructor initializes the contract with the Wormhole message sender address
     * @param _msgSenderAddress The address of the Wormhole message sender contract
     * @param _initialFee The initial fee required for Wormhole messages
     */
    constructor(address _msgSenderAddress, address _uniProxyAddress, uint256 _initialFee) {
        require(_msgSenderAddress != address(0), "NFTProofRelay: Wormhole message sender address cannot be zero");
        msgSenderAddress = _msgSenderAddress;
        uniProxyAddress = _uniProxyAddress;
        wormholeFee = _initialFee;
    }

    /**
     * @dev Updates the approved status of an NFT contract
     * @param nftContract The address of the NFT contract
     * @param status Approval status (true = approved, false = not approved)
     */
    function setApprovedNFTContract(address nftContract, bool status) external onlyOwner {
        require(nftContract != address(0), "NFTProofRelay: NFT contract address cannot be zero");

        // Only make changes if the status is different
        if (approvedNFTContracts[nftContract] != status) {
            approvedNFTContracts[nftContract] = status;

            // Update the list of approved NFT contracts
            if (status) {
                // Add to the list if it's being approved
                bool exists = false;
                for (uint i = 0; i < approvedNFTList.length; i++) {
                    if (approvedNFTList[i] == nftContract) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    approvedNFTList.push(nftContract);
                }
            } else {
                // Remove from the list if it's being disapproved
                for (uint i = 0; i < approvedNFTList.length; i++) {
                    if (approvedNFTList[i] == nftContract) {
                        approvedNFTList[i] = approvedNFTList[approvedNFTList.length - 1];
                        approvedNFTList.pop();
                        break;
                    }
                }
            }

            emit ApprovedNFTContractUpdated(nftContract, status);
        }
    }

    /**
     * @dev Updates the Wormhole message sender address
     * @param _msgSenderAddress The new Wormhole message sender address
     */
    function setMsgSenderAddress(address _msgSenderAddress) external onlyOwner {
        require(_msgSenderAddress != address(0), "NFTProofRelay: Wormhole message sender address cannot be zero");
        address oldAddress = msgSenderAddress;
        msgSenderAddress = _msgSenderAddress;
        emit WormholeAddressUpdated(oldAddress, _msgSenderAddress);
    }

    function setUniProxyAddress(address _uniProxyAddress) external onlyOwner {
        require(_uniProxyAddress != address(0), "NFTProofRelay: UniPoxy address cannot be zero");
        address oldAddress = uniProxyAddress;
        uniProxyAddress = _uniProxyAddress;
        emit UniProxyAddressUpdated(oldAddress, _uniProxyAddress);
    }
    /**
     * @dev Updates the fee required for Wormhole messages
     * @param _wormholeFee The new fee amount
     */
    function setWormholeFee(uint256 _wormholeFee) external onlyOwner {
        uint256 oldFee = wormholeFee;
        wormholeFee = _wormholeFee;
        emit WormholeFeeUpdated(oldFee, _wormholeFee);
    }

    /**
     * @dev Pauses the contract, preventing new proof submissions
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract, allowing proof submissions
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Retrieves the total number of approved NFT contracts
     * @return The number of approved NFT contracts
     */
    function getApprovedNFTCount() external view returns (uint256) {
        return approvedNFTList.length;
    }

    /**
     * @dev Verifies ownership of an NFT by a proxy account
     * @param nftContract The address of the NFT contract
     * @param proxyAccount The address of the proxy account (NFT owner)
     * @param tokenId The ID of the NFT token
     * @return True if the proxy account owns the NFT, false otherwise
     */
    function verifyOwnership(
        address nftContract,
        address proxyAccount,
        uint256 tokenId
    ) public view returns (bool) {
        try IERC721(nftContract).ownerOf(tokenId) returns (address owner) {
            return owner == proxyAccount;
        } catch {
            return false;
        }
    }
    /**
     * @dev Sends NFT ownership proof to Solana via Wormhole
     * @param nftContractToken The address of the NFT contract
     * @return sequence The sequence number of the Wormhole message
     */
    function sendProof(
        bytes32 nftContractToken,
        bytes calldata payload
    ) external payable nonReentrant whenNotPaused returns (uint64 sequence) {
        address nftContract = address(uint160(uint256(nftContractToken)));
        uint256 tokenId = uint256(uint64(uint256(nftContractToken) >> 160));
        uint16 chainId = uint16(uint256(nftContractToken) >> 224);

        require(approvedNFTContracts[nftContract], "NFTProofRelay: NFT contract not approved");
        // Check that enough ETH was sent to cover the Wormhole fee
        require(msg.value >= wormholeFee, "NFTProofRelay: Insufficient fee for Wormhole transfer");

        // Verify that the sender (proxy account) owns the NFT
        require(verifyOwnership(nftContract, msg.sender, tokenId), "NFTProofRelay: Sender does not own this NFT");

        // Check that this token hasn't already been relayed
        // TODO:It should be possible to send messages multiple times to prove that you own this nft
        // require(!tokenRelayed[nftContract][tokenId], "NFTProofRelay: NFT already relayed");

        // Mark the token as relayed
        tokenRelayed[nftContract][tokenId] = true;

        // Prepare payload for Wormhole
        // Format: [proxy_account (20 bytes)][nft_contract (20 bytes)][token_id (32 bytes)][solana_receiver (variable bytes)]
//        bytes memory payload = abi.encodePacked(
//        payloadHead,
//            msg.sender,                 // proxy account (20 bytes)
//            nftContract,                // NFT contract address (20 bytes)
//            tokenId,                    // token ID (32 bytes)
//            solanaReceiver              // Solana receiver address (32 bytes)
//        );
        bytes memory modifiedPayload = new bytes(payload.length - 64);
        bytes32 sender = IUniProxy(uniProxyAddress).getReverseAddress(chainId, msg.sender);

        for (uint256 i = 0; i < payload.length - 64; i++) {
            modifiedPayload[i] = payload[64 + i];
        }
        for (uint256 i = 0; i < 32; i++) {
            modifiedPayload[211 + i] = sender[i];
        }
        // Send message through Wormhole
        sequence = ISendMessage(msgSenderAddress).sendMessage{value: msg.value}(
            modifiedPayload
        );

        emit NFTProofSubmitted(msg.sender, nftContract, tokenId, sequence);
        return sequence;
    }

    /**
     * @dev Allows the owner to withdraw any excess ETH from the contract
     * @param to The address to send the ETH to
     * @param amount The amount of ETH to withdraw
     */
    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "NFTProofRelay: Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "NFTProofRelay: ETH transfer failed");
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {}
}