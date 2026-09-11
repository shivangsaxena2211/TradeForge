// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IUserRegistry} from "./IUserRegistry.sol";

/// @title Stock
/// @notice Simulated stock registry, virtual cash, holdings, and market trades for DEFINN.
/// @dev Academic simulation only. No real securities, INR, ETH, or bank balances are represented.
contract Stock is Ownable {
    /// @dev 1 virtual-cash unit = ₹0.01 (1 paise). Example: ₹150.50 => 15050 units.
    uint256 public constant VIRTUAL_CASH_UNIT = 1;

    /// @dev Share quantity scale. 1 whole share = 10^8 units. Example: 1.25 shares => 125_000_000.
    uint256 public constant QUANTITY_SCALE = 1e8;

    enum TradeSide {
        BUY,
        SELL
    }

    struct StockRecord {
        uint256 id;
        string symbol;
        string name;
        uint256 price;
        bool active;
    }

    struct TradeRecord {
        uint256 tradeId;
        address user;
        uint256 stockId;
        TradeSide side;
        uint256 quantity;
        uint256 executionPrice;
        uint256 totalValue;
        uint256 timestamp;
    }

    IUserRegistry public immutable userRegistry;

    uint256 private _nextStockId = 1;
    uint256 private _nextTradeId = 1;

    mapping(uint256 => StockRecord) private _stocks;
    mapping(bytes32 => uint256) private _symbolToStockId;
    mapping(address => uint256) private _virtualCash;
    mapping(address => mapping(uint256 => uint256)) private _holdings;
    mapping(uint256 => TradeRecord) private _trades;

    error UserNotRegistered();
    error InvalidStockId();
    error DuplicateSymbol();
    error InvalidPrice();
    error StockInactive();
    error ZeroQuantity();
    error InsufficientVirtualCash();
    error InsufficientHolding();
    error ArrayLengthMismatch();

    event StockCreated(
        uint256 indexed stockId,
        string symbol,
        string name,
        uint256 price
    );
    event StockPriceUpdated(uint256 indexed stockId, uint256 newPrice);
    event StockStatusChanged(uint256 indexed stockId, bool active);
    event VirtualCashCredited(address indexed user, uint256 amount);
    event TradeExecuted(
        uint256 indexed tradeId,
        address indexed user,
        uint256 indexed stockId,
        TradeSide side,
        uint256 quantity,
        uint256 executionPrice,
        uint256 totalValue,
        uint256 timestamp
    );

    constructor(address userRegistryAddress) Ownable(msg.sender) {
        userRegistry = IUserRegistry(userRegistryAddress);
    }

    /// @notice Create a simulated stock instrument (admin only).
    function createStock(
        string calldata symbol,
        string calldata name,
        uint256 price
    ) external onlyOwner returns (uint256 stockId) {
        if (price == 0) {
            revert InvalidPrice();
        }

        bytes32 symbolKey = keccak256(bytes(symbol));
        if (_symbolToStockId[symbolKey] != 0) {
            revert DuplicateSymbol();
        }

        stockId = _nextStockId++;
        _stocks[stockId] = StockRecord({
            id: stockId,
            symbol: symbol,
            name: name,
            price: price,
            active: true
        });
        _symbolToStockId[symbolKey] = stockId;

        emit StockCreated(stockId, symbol, name, price);
    }

    /// @notice Update a simulated stock price (admin only).
    function updateStockPrice(uint256 stockId, uint256 newPrice) external onlyOwner {
        StockRecord storage stock = _requireExistingStock(stockId);
        if (newPrice == 0) {
            revert InvalidPrice();
        }

        stock.price = newPrice;
        emit StockPriceUpdated(stockId, newPrice);
    }

    /// @notice Batch update simulated stock prices (admin / simulation oracle only).
    function updateStockPrices(
        uint256[] calldata stockIds,
        uint256[] calldata prices
    ) external onlyOwner {
        if (stockIds.length != prices.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 index = 0; index < stockIds.length; index++) {
            uint256 stockId = stockIds[index];
            uint256 newPrice = prices[index];

            if (newPrice == 0) {
                revert InvalidPrice();
            }

            StockRecord storage stock = _requireExistingStock(stockId);
            stock.price = newPrice;
            emit StockPriceUpdated(stockId, newPrice);
        }
    }

    /// @notice Activate or deactivate a simulated stock (admin only).
    function setStockActive(uint256 stockId, bool active) external onlyOwner {
        StockRecord storage stock = _requireExistingStock(stockId);
        stock.active = active;
        emit StockStatusChanged(stockId, active);
    }

    /// @notice Credit simulated virtual cash to a registered user (admin / simulation faucet only).
    /// @dev Simulation-only balance. Not real INR, ETH, or withdrawable currency.
    function creditVirtualCash(address user, uint256 amount) external onlyOwner {
        _requireRegistered(user);
        if (amount == 0) {
            revert ZeroQuantity();
        }

        _virtualCash[user] += amount;
        emit VirtualCashCredited(user, amount);
    }

    /// @notice Execute a simulated market buy at the current stock price.
    function buy(uint256 stockId, uint256 quantity) external {
        address trader = msg.sender;
        _requireRegistered(trader);
        if (quantity == 0) {
            revert ZeroQuantity();
        }

        StockRecord storage stock = _requireActiveStock(stockId);
        uint256 totalCost = _tradeValue(stock.price, quantity);

        if (_virtualCash[trader] < totalCost) {
            revert InsufficientVirtualCash();
        }

        _virtualCash[trader] -= totalCost;
        _holdings[trader][stockId] += quantity;

        _recordTrade(trader, stockId, TradeSide.BUY, quantity, stock.price, totalCost);
    }

    /// @notice Execute a simulated market sell at the current stock price.
    function sell(uint256 stockId, uint256 quantity) external {
        address trader = msg.sender;
        _requireRegistered(trader);
        if (quantity == 0) {
            revert ZeroQuantity();
        }

        StockRecord storage stock = _requireActiveStock(stockId);

        uint256 currentHolding = _holdings[trader][stockId];
        if (currentHolding < quantity) {
            revert InsufficientHolding();
        }

        uint256 totalProceeds = _tradeValue(stock.price, quantity);

        _holdings[trader][stockId] = currentHolding - quantity;
        _virtualCash[trader] += totalProceeds;

        _recordTrade(trader, stockId, TradeSide.SELL, quantity, stock.price, totalProceeds);
    }

    /// @notice Read simulated stock metadata.
    function getStock(uint256 stockId)
        external
        view
        returns (
            uint256 id,
            string memory symbol,
            string memory name,
            uint256 price,
            bool active
        )
    {
        StockRecord memory stock = _requireExistingStock(stockId);
        return (stock.id, stock.symbol, stock.name, stock.price, stock.active);
    }

    /// @notice Read simulated virtual cash for an address.
    function getVirtualCash(address user) external view returns (uint256) {
        return _virtualCash[user];
    }

    /// @notice Read a user's holding quantity for a stock.
    function getHolding(address user, uint256 stockId) external view returns (uint256) {
        _requireExistingStock(stockId);
        return _holdings[user][stockId];
    }

    /// @notice Read an executed trade record.
    function getTrade(uint256 tradeId)
        external
        view
        returns (
            uint256 id,
            address user,
            uint256 stockId,
            TradeSide side,
            uint256 quantity,
            uint256 executionPrice,
            uint256 totalValue,
            uint256 timestamp
        )
    {
        TradeRecord memory trade = _trades[tradeId];
        if (trade.tradeId == 0) {
            revert InvalidStockId();
        }

        return (
            trade.tradeId,
            trade.user,
            trade.stockId,
            trade.side,
            trade.quantity,
            trade.executionPrice,
            trade.totalValue,
            trade.timestamp
        );
    }

    /// @notice Total number of stocks created.
    function stockCount() external view returns (uint256) {
        return _nextStockId - 1;
    }

    /// @notice Total number of trades executed.
    function tradeCount() external view returns (uint256) {
        return _nextTradeId - 1;
    }

    /// @notice Compute trade value using deterministic floor division.
    /// @dev total = floor(price * quantity / QUANTITY_SCALE). Fractional paise is truncated.
    function computeTradeValue(uint256 price, uint256 quantity) external pure returns (uint256) {
        return _tradeValue(price, quantity);
    }

    function _tradeValue(uint256 price, uint256 quantity) private pure returns (uint256) {
        return (price * quantity) / QUANTITY_SCALE;
    }

    function _recordTrade(
        address user,
        uint256 stockId,
        TradeSide side,
        uint256 quantity,
        uint256 executionPrice,
        uint256 totalValue
    ) private {
        uint256 tradeId = _nextTradeId++;
        _trades[tradeId] = TradeRecord({
            tradeId: tradeId,
            user: user,
            stockId: stockId,
            side: side,
            quantity: quantity,
            executionPrice: executionPrice,
            totalValue: totalValue,
            timestamp: block.timestamp
        });

        emit TradeExecuted(
            tradeId,
            user,
            stockId,
            side,
            quantity,
            executionPrice,
            totalValue,
            block.timestamp
        );
    }

    function _requireRegistered(address user) private view {
        if (!userRegistry.isRegistered(user)) {
            revert UserNotRegistered();
        }
    }

    function _requireExistingStock(uint256 stockId) private view returns (StockRecord storage stock) {
        if (stockId == 0 || stockId >= _nextStockId) {
            revert InvalidStockId();
        }
        stock = _stocks[stockId];
    }

    function _requireActiveStock(uint256 stockId) private view returns (StockRecord storage stock) {
        stock = _requireExistingStock(stockId);
        if (!stock.active) {
            revert StockInactive();
        }
    }
}
