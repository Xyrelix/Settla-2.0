// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @title SettlaV2: non-custodial USDC invoicing + recurring subscriptions on Arc
contract SettlaV2 {
    enum Status {
        None,
        Open,
        Paid,
        Cancelled
    }

    struct Invoice {
        address merchant;
        address payer;
        uint256 amount; // USDC, 6 decimals
        uint64 createdAt;
        uint64 paidAt;
        Status status;
        string memo;
    }

    struct Plan {
        address merchant;
        uint256 amount; // USDC per interval, 6 decimals
        uint64 interval; // seconds between charges
        uint32 maxCharges; // 0 = unlimited
        bool active;
        string memo;
    }

    struct Subscription {
        address subscriber;
        uint256 planId;
        uint64 startedAt;
        uint64 lastChargedAt;
        uint32 chargeCount;
        bool active;
    }

    uint256 public constant MAX_MEMO_LENGTH = 280;
    uint64 public constant MIN_PLAN_INTERVAL = 60;

    IERC20 public immutable usdc;

    // One-off invoices
    uint256 public nextId = 1;
    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _byMerchant;

    // Recurring plans/subscriptions
    uint256 public nextPlanId = 1;
    uint256 public nextSubId = 1;
    mapping(uint256 => Plan) private _plans;
    mapping(uint256 => Subscription) private _subscriptions;
    mapping(address => uint256[]) private _plansByMerchant;
    mapping(address => uint256[]) private _subsBySubscriber;

    // Original Settla events
    event InvoiceCreated(uint256 indexed id, address indexed merchant, uint256 amount, string memo);
    event Settled(uint256 indexed id, address indexed merchant, address indexed payer, uint256 amount);
    event InvoiceCancelled(uint256 indexed id);

    // Recurring events
    event PlanCreated(
        uint256 indexed planId,
        address indexed merchant,
        uint256 amount,
        uint64 interval,
        uint32 maxCharges,
        string memo
    );
    event PlanDeactivated(uint256 indexed planId);
    event Subscribed(uint256 indexed subId, uint256 indexed planId, address indexed subscriber);
    event Charged(uint256 indexed subId, uint256 indexed planId, address indexed subscriber, uint256 amount);
    event SubscriptionCancelled(uint256 indexed subId);

    // Original Settla errors
    error ZeroAddress();
    error NotAContract();
    error ZeroAmount();
    error MemoTooLong();
    error NotOpen();
    error NotMerchant();
    error TransferFailed();

    // Recurring errors
    error PlanNotFound();
    error PlanInactive();
    error NotSubscriber();
    error NotMerchantOrSubscriber();
    error TooEarlyToCharge();
    error MaxChargesReached();
    error SubscriptionInactive();
    error IntervalTooShort();

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert ZeroAddress();
        if (usdc_.code.length == 0) revert NotAContract();
        usdc = IERC20(usdc_);
    }

    // -------------------------------------------------------------------------
    // One-off invoice functionality (original Settla)
    // -------------------------------------------------------------------------

    function createInvoice(uint256 amount, string calldata memo) external returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (bytes(memo).length > MAX_MEMO_LENGTH) revert MemoTooLong();

        id = nextId++;
        _invoices[id] = Invoice({
            merchant: msg.sender,
            payer: address(0),
            amount: amount,
            createdAt: uint64(block.timestamp),
            paidAt: 0,
            status: Status.Open,
            memo: memo
        });

        _byMerchant[msg.sender].push(id);
        emit InvoiceCreated(id, msg.sender, amount, memo);
    }

    function pay(uint256 id) external {
        Invoice storage inv = _invoices[id];
        if (inv.status != Status.Open) revert NotOpen();

        inv.status = Status.Paid;
        inv.payer = msg.sender;
        inv.paidAt = uint64(block.timestamp);

        _transferFromOrRevert(msg.sender, inv.merchant, inv.amount);
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

    // -------------------------------------------------------------------------
    // Recurring subscription functionality
    // -------------------------------------------------------------------------

    function createPlan(
        uint256 amount,
        uint64 interval,
        uint32 maxCharges,
        string calldata memo
    ) external returns (uint256 planId) {
        if (amount == 0) revert ZeroAmount();
        if (interval < MIN_PLAN_INTERVAL) revert IntervalTooShort();
        if (bytes(memo).length > MAX_MEMO_LENGTH) revert MemoTooLong();

        planId = nextPlanId++;
        _plans[planId] = Plan({
            merchant: msg.sender,
            amount: amount,
            interval: interval,
            maxCharges: maxCharges,
            active: true,
            memo: memo
        });

        _plansByMerchant[msg.sender].push(planId);
        emit PlanCreated(planId, msg.sender, amount, interval, maxCharges, memo);
    }

    function deactivatePlan(uint256 planId) external {
        Plan storage plan = _plans[planId];
        if (plan.merchant == address(0)) revert PlanNotFound();
        if (plan.merchant != msg.sender) revert NotMerchant();

        plan.active = false;
        emit PlanDeactivated(planId);
    }

    function subscribe(uint256 planId) external returns (uint256 subId) {
        Plan storage plan = _plans[planId];
        if (plan.merchant == address(0)) revert PlanNotFound();
        if (!plan.active) revert PlanInactive();

        subId = nextSubId++;
        _subscriptions[subId] = Subscription({
            subscriber: msg.sender,
            planId: planId,
            startedAt: uint64(block.timestamp),
            lastChargedAt: uint64(block.timestamp),
            chargeCount: 1,
            active: true
        });

        _subsBySubscriber[msg.sender].push(subId);

        // Immediate first charge must succeed or entire tx reverts.
        _transferFromOrRevert(msg.sender, plan.merchant, plan.amount);

        emit Subscribed(subId, planId, msg.sender);
        emit Charged(subId, planId, msg.sender, plan.amount);
    }

    function charge(uint256 subId) external {
        Subscription storage sub = _subscriptions[subId];
        if (!sub.active) revert SubscriptionInactive();

        Plan storage plan = _plans[sub.planId];
        if (plan.merchant == address(0)) revert PlanNotFound();
        if (!plan.active) revert PlanInactive();

        if (plan.maxCharges != 0 && sub.chargeCount >= plan.maxCharges) {
            revert MaxChargesReached();
        }

        if (block.timestamp < uint256(sub.lastChargedAt) + uint256(plan.interval)) {
            revert TooEarlyToCharge();
        }

        sub.lastChargedAt = uint64(block.timestamp);
        sub.chargeCount += 1;

        _transferFromOrRevert(sub.subscriber, plan.merchant, plan.amount);

        emit Charged(subId, sub.planId, sub.subscriber, plan.amount);
    }

    function cancelSubscription(uint256 subId) external {
        Subscription storage sub = _subscriptions[subId];
        if (!sub.active) revert SubscriptionInactive();

        Plan storage plan = _plans[sub.planId];
        if (msg.sender != sub.subscriber && msg.sender != plan.merchant) {
            revert NotMerchantOrSubscriber();
        }

        sub.active = false;
        emit SubscriptionCancelled(subId);
    }

    function getPlan(uint256 planId) external view returns (Plan memory) {
        return _plans[planId];
    }

    function getSubscription(uint256 subId) external view returns (Subscription memory) {
        return _subscriptions[subId];
    }

    function plansOf(address merchant) external view returns (uint256[] memory) {
        return _plansByMerchant[merchant];
    }

    function subscriptionsOf(address subscriber) external view returns (uint256[] memory) {
        return _subsBySubscriber[subscriber];
    }

    // -------------------------------------------------------------------------
    // Internal transfer helpers
    // -------------------------------------------------------------------------

    function _transferFromOrRevert(address from, address to, uint256 amount) internal {
        if (!_tryTransferFrom(from, to, amount)) revert TransferFailed();
    }

    function _tryTransferFrom(address from, address to, uint256 amount) internal returns (bool) {
        (bool success, bytes memory data) = address(usdc).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );

        if (!success) return false;
        if (data.length != 32) return false;

        return abi.decode(data, (bool));
    }
}
