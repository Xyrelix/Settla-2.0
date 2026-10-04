// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @title Settla: non-custodial USDC invoicing on Arc
contract Settla {
    enum Status { None, Open, Paid, Cancelled }

    struct Invoice {
        address merchant;
        address payer;
        uint256 amount;   // USDC, 6 decimals
        uint64 createdAt;
        uint64 paidAt;
        Status status;
        string memo;
    }

    uint256 public constant MAX_MEMO_LENGTH = 280;

    IERC20 public immutable usdc;
    uint256 public nextId = 1;

    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _byMerchant;

    event InvoiceCreated(uint256 indexed id, address indexed merchant, uint256 amount, string memo);
    event Settled(uint256 indexed id, address indexed merchant, address indexed payer, uint256 amount);
    event InvoiceCancelled(uint256 indexed id);

    error ZeroAddress();
    error ZeroAmount();
    error MemoTooLong();
    error NotOpen();
    error NotMerchant();
    error TransferFailed();

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert ZeroAddress();
        usdc = IERC20(usdc_);
    }

    function createInvoice(uint256 amount, string calldata memo) external returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (bytes(memo).length > MAX_MEMO_LENGTH) revert MemoTooLong();
        id = nextId++;
        _invoices[id] = Invoice(msg.sender, address(0), amount, uint64(block.timestamp), 0, Status.Open, memo);
        _byMerchant[msg.sender].push(id);
        emit InvoiceCreated(id, msg.sender, amount, memo);
    }

    function pay(uint256 id) external {
        Invoice storage inv = _invoices[id];
        if (inv.status != Status.Open) revert NotOpen();
        inv.status = Status.Paid;
        inv.payer = msg.sender;
        inv.paidAt = uint64(block.timestamp);
        if (!usdc.transferFrom(msg.sender, inv.merchant, inv.amount)) revert TransferFailed();
        emit Settled(id, inv.merchant, msg.sender, inv.amount);
    }

    function cancel(uint256 id) external {
        Invoice storage inv = _invoices[id];
        if (inv.merchant != msg.sender) revert NotMerchant();
        if (inv.status != Status.Open) revert NotOpen();
        inv.status = Status.Cancelled;
        emit InvoiceCancelled(id);
    }

    function getInvoice(uint256 id) external view returns (Invoice memory) {
        return _invoices[id];
    }

    function invoicesOf(address merchant) external view returns (uint256[] memory) {
        return _byMerchant[merchant];
    }
}
