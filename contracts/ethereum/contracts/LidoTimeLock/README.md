# BolarityStakeLido

### **EthToStethStaking Usage Guide**

This guide explains how to use the `ProxyContractLido` contract for staking ETH, managing stETH withdrawals, and claiming ETH.

---

### **1. Deploying the Contract**

Deploy the contract with the following parameters:
- `lido`: The address of the Lido contract.
- `withdrawalQueue`: The address of the Withdrawal Queue contract.

Example:
```solidity
constructor(address _lido, address _withdrawalQueue)
```

---

### **2. Staking ETH**

Stake ETH to receive `stETH`. The `stETH` will be locked for a specified duration set by the user.

- **Function**: `stake`
- **Input**:
  - `lockTime`: The lock duration in seconds (minimum 1 minute).
  - Send ETH with the transaction.
- **Output**:
  - Your stETH is locked in the contract until the specified time.
  - The `Staked` event is emitted.

Example:
```javascript
await contract.stake(lockTime, { value: ethers.utils.parseEther("1") });
```

---

### **3. Requesting Withdrawals**

Request withdrawal of your unlocked `stETH`.

- **Function**: `requestWithdrawal`
- **Input**:
  - `totalStEthAmount`: The total amount of stETH to withdraw (in wei).
- **Output**:
  - Generates withdrawal request IDs.
  - The `WithdrawalRequested` event is emitted.

Example:
```javascript
await contract.requestWithdrawal(ethers.utils.parseUnits("1", 18));
```

---

### **4. Claiming Withdrawals**

Claim ETH for finalized withdrawals.

#### Claim to a Recipient:
- **Function**: `claimWithdrawalsTo`
- **Input**:
  - `requestIds`: Array of withdrawal request IDs.
  - `hints`: Array of hints for optimization.
  - `recipient`: Address to receive the ETH.
- **Output**:
  - The `WithdrawalClaimed` event is emitted.

Example:
```javascript
await contract.claimWithdrawalsTo([11214, 11215], [0, 0], "0xRecipientAddress");
```

#### Claim to Self:
- **Function**: `claimWithdrawals`
- **Input**:
  - `requestIds`: Array of withdrawal request IDs.
- **Output**:
  - The `SingleWithdrawalClaimed` event is emitted for each claim.

Example:
```javascript
await contract.claimWithdrawals([11214, 11215]);
```

---

### **5. Checking Withdrawal Status**

Check the status of your withdrawal requests.

- **Function**: `getWithdrawalStatus`
- **Input**:
  - `requestIds`: Array of request IDs.
- **Output**:
  - Returns detailed status for each request, including:
    - Amount of `stETH`.
    - Shares.
    - Owner.
    - Timestamp.
    - Finalization and claim status.

Example:
```javascript
const status = await contract.getWithdrawalStatus([11214, 11215]);
console.log(status);
```

---

### **6. Viewing stETH Balance**

View your stETH balance, separated into withdrawable and locked amounts.

- **Function**: `getStEthBalance`
- **Input**:
  - `userAddress`: Your address.
- **Output**:
  - `withdrawableBalance`: Amount of stETH available for withdrawal.
  - `lockedBalance`: Amount of stETH still locked.

Example:
```javascript
const [withdrawable, locked] = await contract.getStEthBalance("0xYourAddress");
console.log(`Withdrawable: ${withdrawable}, Locked: ${locked}`);
```

---

### **7. Viewing Withdrawal NFTs**

Retrieve the list of withdrawal request IDs (NFTs) for a user.

- **Function**: `getUserWithdrawalNFTs`
- **Input**:
  - `userAddress`: The user's address.
- **Output**:
  - Array of withdrawal request IDs.

Example:
```javascript
const nftIds = await contract.getUserWithdrawalNFTs("0xYourAddress");
console.log(nftIds);
```

---

### **Error Handling**

1. **Staking with 0 ETH**:
   - Error: `"ETH amount must be greater than zero"`.

2. **Requesting Withdrawals with Insufficient stETH**:
   - Error: `"Insufficient unlocked stETH balance"`.

3. **Empty Withdrawal Requests**:
   - Error: `"No request IDs provided"`.

4. **Mismatched Hints in Claiming**:
   - Error: `"Hints length mismatch"`.

---

### **Notes**

- Ensure sufficient ETH for staking and gas fees.
- Only finalized and unclaimed withdrawal requests can be claimed.
- `stETH` remains locked until the specified `lockTime` expires.

This guide should help you interact effectively with the `BolarityStakeLido` contract!

