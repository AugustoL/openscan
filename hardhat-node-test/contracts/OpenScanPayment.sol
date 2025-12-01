// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

contract OpenScanPayment is Ownable {

  event PaymentReceived(address indexed payer, uint256 amount);
  event DonationReceived(address indexed donor, uint256 amount);

  constructor(address initialOwner) Ownable(initialOwner) {}

  // Pay to OpenScan with a signature to be used later for verification
  // After payment you will need to provide the a signature off-chain of the tx hash
  // The tx hash has to be signed by the sender of the payment
  // The signature has to be provided on the pull request on the explorer-metadata repository
  function pay() public payable {
    require(msg.value > 0, "pay: payment must be greater than zero");
    emit PaymentReceived(msg.sender, msg.value);
    (bool success, ) = owner().call{value: msg.value}("");
    require(success, "transfer failed");
  }

  // Donate to OpenScan with a message to be shown publicly
  // WARNING: Messages are subject to moderation and may not be displayed
  function donate(string calldata message) public payable {
    require(msg.value > 0, "donate: donation must be greater than zero");
    emit DonationReceived(msg.sender, msg.value);
    (bool success, ) = owner().call{value: msg.value}("");
    require(success, "transfer failed");
    // message is stored in calldata for off-chain retrieval
  }

  // Execute arbitrary call (onlyOwner) to recover funds and tokens
  function executeCall(address target, bytes memory data) public onlyOwner returns (bytes memory) {
    (bool success, bytes memory returnData) = target.call(data);
    require(success, "executeCall: call failed");
    return returnData;
  }
}
