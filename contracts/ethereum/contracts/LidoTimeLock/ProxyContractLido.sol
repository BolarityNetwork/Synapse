// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILido {
    function submit(address referral) external payable returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IWithdrawalQueue {
    struct WithdrawalRequestStatus {
        uint256 amountOfStETH;
        uint256 amountOfShares;
        address owner;
        uint256 timestamp;
        bool isFinalized;
        bool isClaimed;
    }

    function requestWithdrawals(uint256[] calldata _amounts, address _owner) external returns (uint256[] memory requestIds);
    function claimWithdrawalsTo(uint256[] calldata _requestIds, uint256[] calldata _hints, address _recipient) external;
    function getWithdrawalStatus(uint256[] calldata _requestIds) external view returns (WithdrawalRequestStatus[] memory statuses);
}

contract EthToStethStaking {
    ILido public lido;
    IWithdrawalQueue public withdrawalQueue;

    struct Stake {
        uint256 originalAmount;   // Original stETH amount staked
        uint256 remainingAmount;  // Remaining stETH amount for withdrawal
        uint256 lockUntil;        // Lock expiration timestamp
        bool isProcessed;         // Whether this stake has been fully processed
    }

    mapping(address => Stake[]) public userStakes; // Mapping of user to their stakes
    mapping(address => uint256[]) public userWithdrawalNFTs; // Mapping to track user's withdrawal NFTs

    event Staked(address indexed user, uint256 ethAmount, uint256 stEthReceived, uint256 lockUntil);
    event WithdrawalRequested(address indexed user, uint256 totalStEthAmount, uint256[] requestIds);
    event WithdrawalClaimed(address indexed user, uint256[] requestIds, address recipient);

    constructor(address _lido, address _withdrawalQueue) {
        require(_lido != address(0), "Invalid Lido contract address");
        require(_withdrawalQueue != address(0), "Invalid Withdrawal Queue contract address");
        lido = ILido(_lido);
        withdrawalQueue = IWithdrawalQueue(_withdrawalQueue);
    }

    function stake(uint256 lockTime) external payable {
        require(msg.value > 0, "ETH amount must be greater than zero");
        require(lockTime >= 1 minutes, "Lock time must be at least 1 minute");

        uint256 stEthReceived = lido.submit{value: msg.value}(address(0));
        uint256 lockUntil = block.timestamp + lockTime;

        userStakes[msg.sender].push(Stake({
            originalAmount: stEthReceived,
            remainingAmount: stEthReceived,
            lockUntil: lockUntil,
            isProcessed: false
        }));

        emit Staked(msg.sender, msg.value, stEthReceived, lockUntil);
    }

    function requestWithdrawal(uint256 totalStEthAmount) external {
        require(totalStEthAmount > 0, "Withdrawal amount must be greater than zero");

        Stake[] storage stakes = userStakes[msg.sender];
        uint256 unlockedAmount = 0;
        uint256 remainingAmount = totalStEthAmount;

        require(stakes.length > 0, "No stakes available");

        uint256[] memory amountsToWithdraw = new uint256[](stakes.length);
        uint256 amountsCount = 0;

        // Collect unlocked stakes and handle remaining balance
        for (uint256 i = 0; i < stakes.length && remainingAmount > 0; i++) {
            if (!stakes[i].isProcessed && stakes[i].lockUntil <= block.timestamp && stakes[i].remainingAmount > 0) {
                uint256 amountToUse = stakes[i].remainingAmount > remainingAmount ? remainingAmount : stakes[i].remainingAmount;
                unlockedAmount += amountToUse;
                remainingAmount -= amountToUse;

                // Deduct used amount from the remaining amount
                stakes[i].remainingAmount -= amountToUse;

                // If remainingAmount reaches 0, mark this stake as processed
                if (stakes[i].remainingAmount == 0) {
                    stakes[i].isProcessed = true;
                }

                amountsToWithdraw[amountsCount++] = amountToUse;
            }
        }

        require(unlockedAmount >= totalStEthAmount, "Insufficient unlocked stETH balance");

        // Trim the amountsToWithdraw array to the actual number of amounts
        uint256[] memory finalAmounts = new uint256[](amountsCount);
        for (uint256 i = 0; i < amountsCount; i++) {
            finalAmounts[i] = amountsToWithdraw[i];
        }

        bool success = lido.approve(address(withdrawalQueue), totalStEthAmount);
        require(success, "Approval failed");

        uint256[] memory requestIds = withdrawalQueue.requestWithdrawals(finalAmounts, msg.sender);
        for (uint256 i = 0; i < requestIds.length; i++) {
            userWithdrawalNFTs[msg.sender].push(requestIds[i]);
        }

        emit WithdrawalRequested(msg.sender, totalStEthAmount, requestIds);
    }

    function claimWithdrawalsTo(uint256[] calldata requestIds, uint256[] calldata hints, address recipient) external {
        require(requestIds.length > 0, "No requests to claim");
        require(hints.length == requestIds.length, "Hints length mismatch");
        require(recipient != address(0), "Invalid recipient");

        for (uint256 i = 0; i < requestIds.length; i++) {
            require(isUserRequest(msg.sender, requestIds[i]), "Invalid or unowned request ID");
        }

        withdrawalQueue.claimWithdrawalsTo(requestIds, hints, recipient);

        for (uint256 i = 0; i < requestIds.length; i++) {
            removeTokenId(msg.sender, requestIds[i]);
        }

        emit WithdrawalClaimed(msg.sender, requestIds, recipient);
    }

    function isUserRequest(address user, uint256 tokenId) internal view returns (bool) {
        uint256[] memory requests = userWithdrawalNFTs[user];
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i] == tokenId) {
                return true;
            }
        }
        return false;
    }

    function removeTokenId(address user, uint256 tokenId) internal {
        uint256[] storage requests = userWithdrawalNFTs[user];
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i] == tokenId) {
                requests[i] = requests[requests.length - 1];
                requests.pop();
                break;
            }
        }
    }

    function getStEthBalance(address user) external view returns (uint256 withdrawableBalance, uint256 lockedBalance) {
        uint256 totalWithdrawable = 0;
        uint256 totalLocked = 0;
        Stake[] memory stakes = userStakes[user];

        for (uint256 i = 0; i < stakes.length; i++) {
            if (!stakes[i].isProcessed) {
                if (block.timestamp >= stakes[i].lockUntil) {
                    // if time expire, add it into totalWithdrawable
                    totalWithdrawable += stakes[i].remainingAmount;
                } else {
                    // if still in lock，add it into totalLocked
                    totalLocked += stakes[i].remainingAmount;
                }
            }
        }

        return (totalWithdrawable, totalLocked);
    }


    receive() external payable {}

    fallback() external payable {
        revert("Function not supported");
    }
}
