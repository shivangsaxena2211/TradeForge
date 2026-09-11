// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {User} from "../contracts/User.sol";
import {Stock} from "../contracts/Stock.sol";

contract StockTest is Test {
    User internal userContract;
    Stock internal stockContract;

    address internal admin = makeAddr("admin");
    address internal trader = makeAddr("trader");
    address internal outsider = makeAddr("outsider");

    uint256 internal constant PRICE_150_50 = 15050; // ₹150.50
    uint256 internal constant QTY_1_25 = 125_000_000; // 1.25 shares
    uint256 internal constant QTY_1 = 100_000_000; // 1 share

    function setUp() public {
        userContract = new User();

        vm.prank(admin);
        stockContract = new Stock(address(userContract));

        vm.prank(trader);
        userContract.register();
    }

    function _createDemoStock() internal returns (uint256 stockId) {
        vm.prank(admin);
        stockId = stockContract.createStock("DEMO", "Demo Stock", PRICE_150_50);
    }

    function _fundTrader(uint256 amount) internal {
        vm.prank(admin);
        stockContract.creditVirtualCash(trader, amount);
    }

    function test_AdminCanCreateStock() public {
        uint256 stockId = _createDemoStock();

        (
            uint256 id,
            string memory symbol,
            string memory name,
            uint256 price,
            bool active
        ) = stockContract.getStock(stockId);

        assertEq(id, stockId);
        assertEq(symbol, "DEMO");
        assertEq(name, "Demo Stock");
        assertEq(price, PRICE_150_50);
        assertTrue(active);
    }

    function test_NonAdminCannotCreateStock() public {
        vm.prank(outsider);
        vm.expectRevert();
        stockContract.createStock("FAIL", "Fail Stock", PRICE_150_50);
    }

    function test_DuplicateSymbolFails() public {
        _createDemoStock();

        vm.prank(admin);
        vm.expectRevert(Stock.DuplicateSymbol.selector);
        stockContract.createStock("DEMO", "Duplicate", PRICE_150_50);
    }

    function test_StockDataCanBeRead() public {
        uint256 stockId = _createDemoStock();
        assertEq(stockContract.stockCount(), 1);

        (,, string memory name,,) = stockContract.getStock(stockId);
        assertEq(name, "Demo Stock");
    }

    function test_AdminCanUpdatePrice() public {
        uint256 stockId = _createDemoStock();

        vm.prank(admin);
        stockContract.updateStockPrice(stockId, 20000);

        (,,, uint256 price,) = stockContract.getStock(stockId);
        assertEq(price, 20000);
    }

    function test_NonAdminCannotUpdatePrice() public {
        uint256 stockId = _createDemoStock();

        vm.prank(outsider);
        vm.expectRevert();
        stockContract.updateStockPrice(stockId, 20000);
    }

    function test_AdminCanDeactivateStock() public {
        uint256 stockId = _createDemoStock();

        vm.prank(admin);
        stockContract.setStockActive(stockId, false);

        (,,,, bool active) = stockContract.getStock(stockId);
        assertFalse(active);
    }

    function test_InactiveStockCannotBeTraded() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.prank(admin);
        stockContract.setStockActive(stockId, false);

        vm.prank(trader);
        vm.expectRevert(Stock.StockInactive.selector);
        stockContract.buy(stockId, QTY_1);
    }

    function test_RegisteredUserCanReceiveVirtualCash() public {
        _fundTrader(500_000);
        assertEq(stockContract.getVirtualCash(trader), 500_000);
    }

    function test_NonAdminCannotCreditVirtualCash() public {
        vm.prank(outsider);
        vm.expectRevert();
        stockContract.creditVirtualCash(trader, 1000);
    }

    function test_RegisteredUserCanBuyStock() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.prank(trader);
        stockContract.buy(stockId, QTY_1);

        assertEq(stockContract.getHolding(trader, stockId), QTY_1);
    }

    function test_BuyDeductsCorrectVirtualCash() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        uint256 expectedCost = stockContract.computeTradeValue(PRICE_150_50, QTY_1);

        vm.prank(trader);
        stockContract.buy(stockId, QTY_1);

        assertEq(expectedCost, 15050);
        assertEq(stockContract.getVirtualCash(trader), 1_000_000 - expectedCost);
    }

    function test_BuyIncreasesHolding() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.prank(trader);
        stockContract.buy(stockId, QTY_1_25);

        assertEq(stockContract.getHolding(trader, stockId), QTY_1_25);
    }

    function test_InsufficientVirtualCashFails() public {
        uint256 stockId = _createDemoStock();

        vm.prank(trader);
        vm.expectRevert(Stock.InsufficientVirtualCash.selector);
        stockContract.buy(stockId, QTY_1);
    }

    function test_RegisteredUserCanSellStock() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.startPrank(trader);
        stockContract.buy(stockId, QTY_1);
        stockContract.sell(stockId, QTY_1);
        vm.stopPrank();

        assertEq(stockContract.getHolding(trader, stockId), 0);
    }

    function test_SellDecreasesHolding() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.startPrank(trader);
        stockContract.buy(stockId, QTY_1_25);
        stockContract.sell(stockId, QTY_1);
        vm.stopPrank();

        assertEq(stockContract.getHolding(trader, stockId), 25_000_000);
    }

    function test_SellCreditsCorrectVirtualCash() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(500_000);

        vm.startPrank(trader);
        stockContract.buy(stockId, QTY_1);
        uint256 cashAfterBuy = stockContract.getVirtualCash(trader);
        stockContract.sell(stockId, QTY_1);
        vm.stopPrank();

        assertEq(stockContract.getVirtualCash(trader), cashAfterBuy + 15050);
    }

    function test_SellingMoreThanOwnedFails() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.startPrank(trader);
        stockContract.buy(stockId, QTY_1);
        vm.expectRevert(Stock.InsufficientHolding.selector);
        stockContract.sell(stockId, QTY_1_25);
        vm.stopPrank();
    }

    function test_ZeroQuantityBuyFails() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.prank(trader);
        vm.expectRevert(Stock.ZeroQuantity.selector);
        stockContract.buy(stockId, 0);
    }

    function test_ZeroQuantitySellFails() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.startPrank(trader);
        stockContract.buy(stockId, QTY_1);
        vm.expectRevert(Stock.ZeroQuantity.selector);
        stockContract.sell(stockId, 0);
        vm.stopPrank();
    }

    function test_InvalidStockIdFails() public {
        _fundTrader(1_000_000);

        vm.prank(trader);
        vm.expectRevert(Stock.InvalidStockId.selector);
        stockContract.buy(999, QTY_1);
    }

    function test_TradeEventIsEmitted() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.prank(trader);
        vm.expectEmit(true, true, true, true);
        emit Stock.TradeExecuted(
            1,
            trader,
            stockId,
            Stock.TradeSide.BUY,
            QTY_1,
            PRICE_150_50,
            15050,
            block.timestamp
        );
        stockContract.buy(stockId, QTY_1);
    }

    function test_TradeDataCanBeQueried() public {
        uint256 stockId = _createDemoStock();
        _fundTrader(1_000_000);

        vm.prank(trader);
        stockContract.buy(stockId, QTY_1);

        (
            uint256 tradeId,
            address user,
            uint256 queriedStockId,
            Stock.TradeSide side,
            uint256 quantity,
            uint256 executionPrice,
            uint256 totalValue,
            uint256 timestamp
        ) = stockContract.getTrade(1);

        assertEq(tradeId, 1);
        assertEq(user, trader);
        assertEq(queriedStockId, stockId);
        assertTrue(side == Stock.TradeSide.BUY);
        assertEq(quantity, QTY_1);
        assertEq(executionPrice, PRICE_150_50);
        assertEq(totalValue, 15050);
        assertGt(timestamp, 0);
        assertEq(stockContract.tradeCount(), 1);
    }

    function test_UnregisteredUsersCannotTrade() public {
        uint256 stockId = _createDemoStock();

        vm.prank(outsider);
        vm.expectRevert(Stock.UserNotRegistered.selector);
        stockContract.buy(stockId, QTY_1);
    }

    function test_PrecisionFractionalSharesAndDecimalPrice() public {
        // ₹150.50 x 1.25 shares => ₹188.125 nominal, truncated to ₹188.12 (18812 paise units).
        uint256 expected = 18812;

        assertEq(stockContract.computeTradeValue(PRICE_150_50, QTY_1_25), expected);

        uint256 stockId = _createDemoStock();
        _fundTrader(expected);

        vm.prank(trader);
        stockContract.buy(stockId, QTY_1_25);

        assertEq(stockContract.getVirtualCash(trader), 0);
        assertEq(stockContract.getHolding(trader, stockId), QTY_1_25);
    }

    function test_ZeroPriceStockCreationFails() public {
        vm.prank(admin);
        vm.expectRevert(Stock.InvalidPrice.selector);
        stockContract.createStock("ZERO", "Zero Price", 0);
    }

    function test_CreditVirtualCashRequiresRegisteredUser() public {
        vm.prank(admin);
        vm.expectRevert(Stock.UserNotRegistered.selector);
        stockContract.creditVirtualCash(outsider, 1000);
    }

    function test_BatchPriceUpdateWorks() public {
        uint256 stockId = _createDemoStock();

        uint256[] memory ids = new uint256[](1);
        uint256[] memory prices = new uint256[](1);
        ids[0] = stockId;
        prices[0] = 16000;

        vm.prank(admin);
        stockContract.updateStockPrices(ids, prices);

        (, , , uint256 price, ) = stockContract.getStock(stockId);
        assertEq(price, 16000);
    }

    function test_NonAdminCannotBatchUpdatePrices() public {
        uint256 stockId = _createDemoStock();

        uint256[] memory ids = new uint256[](1);
        uint256[] memory prices = new uint256[](1);
        ids[0] = stockId;
        prices[0] = 16000;

        vm.prank(outsider);
        vm.expectRevert();
        stockContract.updateStockPrices(ids, prices);
    }

    function test_BatchPriceUpdateRejectsZeroPrice() public {
        uint256 stockId = _createDemoStock();

        uint256[] memory ids = new uint256[](1);
        uint256[] memory prices = new uint256[](1);
        ids[0] = stockId;
        prices[0] = 0;

        vm.prank(admin);
        vm.expectRevert(Stock.InvalidPrice.selector);
        stockContract.updateStockPrices(ids, prices);
    }
}
