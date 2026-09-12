# ⚒️ TradeForge

### Blockchain-Based Stock Trading Simulation Platform

TradeForge is a full-stack **blockchain-powered stock trading simulation platform** that demonstrates how blockchain and smart contracts can be used to improve transparency, traceability, and automated validation in stock trading workflows.

The platform uses an **Ethereum-compatible local blockchain (Anvil)** and **Solidity smart contracts** to maintain authoritative simulated trading state, while **PostgreSQL** provides the application's queryable data and market-data layer.

> ⚠️ **Academic / Simulation Project**
>
> TradeForge uses virtual money and simulated market data. It does **not** execute real stock trades, handle real money, connect to NSE/BSE brokerage systems, or provide financial services.

---

## ✨ Features

### 📈 Stock Market

- 30 real NSE-listed equities
- Stock search and discovery
- Individual stock detail pages
- Historical price charts
- OHLCV market data
- Simulated live market prices
- Market regimes:
  - Bull
  - Bear
  - Neutral
  - High Volatility
- Sector-based market factors
- Momentum and mean-reversion effects
- Volatility clustering
- Trading-session simulation
- Realistic volume generation

### ⛓️ Blockchain Trading

- Solidity-based trading contracts
- Ethereum-compatible local blockchain
- On-chain stock instruments
- Blockchain-based trade execution
- On-chain virtual cash
- On-chain holdings
- Transaction receipts
- Transaction hashes
- Immutable transaction history
- Smart-contract validation
- Symbol-based stock identity mapping

### 🔐 Custom Wallet

TradeForge includes its own application-level wallet instead of relying on browser wallets such as MetaMask.

Features include:

- Wallet generation
- Ethereum-compatible addresses
- Recovery phrase
- Local encrypted keystore
- Password-based wallet unlocking
- Local transaction signing
- Wallet recovery/import
- Blockchain registration
- Client-side private-key handling

> Private keys and recovery phrases are never stored in PostgreSQL and are never sent to the backend.

### 💰 Virtual Trading

Users receive simulated funds for trading:

₹100,000 Virtual Cash

Users can:

Buy stocks
Sell stocks
View holdings
Track portfolio value
View order history
View transaction history
Monitor available virtual cash

No real money is involved.

### 📊 Portfolio
Current holdings
Quantity owned
Average/cost basis
Current market valuation
Portfolio performance
Available virtual cash
Transaction history


### 🔎 Transaction Explorer

Every blockchain trade produces a blockchain transaction that can be inspected through the application.

The transaction explorer displays information such as:

Transaction hash
Transaction type
Stock
Quantity
Execution price
Status
Wallet address
Block information


### 🏗️ Architecture

TradeForge uses a hybrid on-chain + off-chain architecture.

                    ┌─────────────────────────┐
                    │      TradeForge UI      │
                    │   Next.js + React       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Application Layer     │
                    │ Next.js API / Services  │
                    └───────┬─────────┬───────┘
                            │         │
                ┌───────────┘         └────────────┐
                ▼                                  ▼
      ┌───────────────────┐              ┌───────────────────┐
      │    PostgreSQL     │              │     ethers.js     │
      │                   │              │                   │
      │ Users             │              │ Wallet signing    │
      │ Stocks            │              │ Blockchain RPC    │
      │ Price History     │              │ Contract calls    │
      │ Orders            │              └─────────┬─────────┘
      │ Trades            │                        │
      │ Holdings          │                        ▼
      └───────────────────┘              ┌───────────────────┐
                                         │ Solidity Contracts│
                                         │                   │
                                         │ User.sol          │
                                         │ Stock.sol         │
                                         └─────────┬─────────┘
                                                   │
                                                   ▼
                                         ┌───────────────────┐
                                         │      Anvil        │
                                         │ Local Blockchain  │
                                         │ Chain ID: 31337   │
                                         └───────────────────┘
### 🧩 On-Chain vs Off-Chain Design

TradeForge intentionally does not store every piece of application data on the blockchain.

PostgreSQL

Used for:

User accounts
Authentication metadata
Stock metadata
Historical prices
Simulated market state
Orders
Trade projections
Portfolio projections
Watchlists
Application queries
Blockchain

Used for critical simulated trading state:

Wallet registration
Virtual cash
Stock instruments
Stock purchases
Stock sales
Holdings
Trade records
Transaction events

This hybrid design provides efficient application queries while keeping the core trading ledger verifiable on-chain.

### ⛓️ Smart Contracts

TradeForge currently uses two primary Solidity contracts.

User.sol

Responsible for blockchain-level user registration.

Stores:

Wallet address
Registration state
Registration timestamp

No personally identifiable information is stored on-chain.

Stock.sol

Responsible for simulated stock trading.

Capabilities include:

Create stock instruments
Update stock prices
Deactivate stocks
Credit virtual cash
Buy stocks
Sell stocks
Maintain holdings
Record trades
Emit trading events

The contract uses OpenZeppelin's ownership mechanism for administrative operations.

### 🔑 Stock Identity & Mapping

TradeForge uses:

(exchange, symbol)

as the canonical identity of a stock.

For example:

(NSE, RELIANCE)
(NSE, TCS)
(NSE, INFY)

The PostgreSQL field:

Stock.onChainStockId

stores the corresponding blockchain instrument ID.

On-chain IDs are not assumed to match PostgreSQL IDs or array positions.

This prevents mapping errors when blockchain instruments are created in a different order.

The mapping system is idempotent and can detect stale mappings after a local blockchain reset.

### 📈 Market Simulation

TradeForge includes a deterministic market simulation engine designed to produce more realistic price behavior than a simple random walk.

The simulated return model incorporates:

Market Return
      +
Market Beta
      +
Sector Factor
      +
Momentum
      +
Mean Reversion
      +
Volatility Shock
      ↓
Simulated Return
      ↓
Next Stock Price

Conceptually:

rᵢ =
α
+ βᵢ × marketReturn
+ sectorBetaᵢ × sectorReturn
+ momentum
+ meanReversion
+ volatility × shock

Then:

Price(t+1) = Price(t) × exp(rᵢ)
Simulation features
Deterministic seeded PRNG
Market regimes
Sector factors
Volatility regimes
Volatility clustering
Momentum
Mean reversion
Open/close volatility
Simulated trading session
OHLCV generation
Activity-linked volume

The simulation is intended for demonstration and educational purposes.

### 📊 Supported Stocks

TradeForge currently includes 30 active NSE equities:

ADANIENT
ADANIPORTS
ASIANPAINT
AXISBANK
BAJFINANCE
BHARTIARTL
COALINDIA
HCLTECH
HDFCBANK
HINDUNILVR
ICICIBANK
INFY
ITC
KOTAKBANK
LT
M&M
MARUTI
NTPC
ONGC
POWERGRID
RELIANCE
SBIN
SUNPHARMA
TATAMOTORS
TATASTEEL
TCS
TECHM
TITAN
ULTRACEMCO
WIPRO
🛠️ Tech Stack
Frontend
Next.js 16
React 19
TypeScript
Tailwind CSS
shadcn/ui / Base UI
Recharts
Backend / Application
Next.js App Router
Server Actions
API Routes
Auth.js
Prisma ORM
PostgreSQL
Authentication
Auth.js
Credentials authentication
JWT sessions
Argon2id password hashing
Blockchain
Solidity 0.8.24
Foundry
Anvil
ethers.js 6
OpenZeppelin
Testing
Vitest
Foundry tests
TypeScript type checking
ESLint


### 🚀 Getting Started
Prerequisites

Install:

Node.js
npm
PostgreSQL
Foundry

Verify installations:

node --version
npm --version
psql --version
forge --version
anvil --version


### 📦 Installation

Clone the repository:

git clone https://github.com/YOUR_USERNAME/TradeForge.git
cd TradeForge

Install dependencies:

npm install


### 🔐 Environment Variables

Create:

.env.local

Never commit this file.

Example:

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/tradeforge"

AUTH_SECRET="your-auth-secret"

ANVIL_ADMIN_PRIVATE_KEY="your-local-anvil-admin-key"

Refer to:

.env.example

for the required environment variables.

Never expose private keys through NEXT_PUBLIC_* variables.

### 🗄️ Database Setup

Generate Prisma Client:

npm run db:generate

Run migrations:

npm run db:migrate

Seed the stock universe:

npm run market:seed-universe
⛓️ Start the Blockchain

TradeForge uses Anvil as its local Ethereum-compatible blockchain.

Start Anvil:

npm run blockchain:start

The blockchain runs on:

RPC:      http://127.0.0.1:8545
Chain ID: 31337
⚙️ Local Blockchain Setup

TradeForge provides a one-command infrastructure setup.

Run:

npm run start:local

This command:

Checks PostgreSQL
Starts or detects Anvil
Builds contracts
Detects existing deployments
Reuses valid local contracts
Deploys contracts when necessary
Maps all 30 stocks
Verifies stock mappings
Funds the demo wallet
Sets up virtual trading funds
Exits after infrastructure setup

Expected result:

PostgreSQL       ✓ Connected
Anvil            ✓ Chain 31337
Contracts        ✓ Ready
Stocks           ✓ 30/30 mapped
Verification     ✓ 30/30
Demo ETH         ✓ 0.100 ETH
Virtual Cash     ✓ ₹100,000

Blockchain environment ready

start:local does not start the Next.js frontend.

### 💻 Start the Frontend

After blockchain setup completes, run:

npm run dev

Open:

http://localhost:3000

The frontend and blockchain infrastructure intentionally run as separate processes.

### 💰 Demo Wallet

TradeForge uses an application-level custom wallet for the demo environment.

The demo wallet receives:

0.1 ETH

for local blockchain gas and:

₹100,000

in virtual trading cash.

Run:

npm run demo:fund

The command is idempotent.

It will:

Top up ETH when necessary
Check blockchain registration
Credit virtual cash when below the configured amount
Avoid unnecessary repeated funding


### 👛 Wallet Registration

Because the custom wallet signs its own blockchain transactions, registration must be performed by the wallet itself.

Workflow:

Create / Import Wallet
        ↓
Unlock Wallet
        ↓
Register on Blockchain
        ↓
Wallet signs transaction
        ↓
User.sol
        ↓
Registration confirmed

After registration:

npm run demo:fund

can credit the virtual trading balance.

###📈 Trading Flow

A typical BUY operation follows:

User
 ↓
Select Stock
 ↓
Enter Quantity
 ↓
Trade Panel
 ↓
Server Validation
 ↓
Retrieve On-Chain Stock ID
 ↓
Wallet Signs Transaction
 ↓
Stock.sol
 ↓
Smart Contract Validation
 ↓
Trade Execution
 ↓
Transaction Receipt
 ↓
PostgreSQL Projection
 ↓
Portfolio Updated

SELL follows the same architecture in reverse.

### 🔄 Price Synchronization

TradeForge separates:

Market Simulation Price

from:

On-Chain Execution Price

The simulated market price is maintained in PostgreSQL.

When a trade is submitted, the relevant price is synchronized for blockchain execution.

The blockchain remains authoritative for:

Execution
Virtual cash
Holdings
Trade records

PostgreSQL maintains the application-friendly projection.

### 🧪 Testing

Run all application tests:

npm test

Run smart-contract tests:

npm run blockchain:test

Run TypeScript validation:

npm run typecheck

Run linting:

npm run lint

Run production build:

npm run build

Current validation:

Vitest       149 passed
Foundry       38 passed
Typecheck     PASS
Lint          PASS
Build         PASS
Mappings      30 PASS / 0 FAIL


### 🧪 Stock Mapping Verification

To verify all stock mappings:

npm run trading:verify-on-chain

Expected:

PASS: 30
FAIL: 0

You can also verify specific stocks:

npm run trading:verify-on-chain -- ADANIENT RELIANCE TCS INFY

### 📂 Project Structure
TradeForge/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (main)/
│   │   ├── dashboard/
│   │   ├── markets/
│   │   ├── orders/
│   │   ├── portfolio/
│   │   ├── settings/
│   │   ├── transactions/
│   │   └── wallet/
│   │
│   └── page.tsx
│
├── components/
│   ├── markets/
│   ├── trading/
│   └── ...
│
├── contracts/
│   ├── User.sol
│   ├── Stock.sol
│   └── IUserRegistry.sol
│
├── lib/
│   ├── auth/
│   ├── blockchain/
│   ├── market/
│   ├── trading/
│   ├── wallet/
│   └── demo/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── scripts/
│   ├── start-local.ts
│   ├── fund-demo-wallet.ts
│   ├── setup-on-chain-trading.ts
│   ├── verify-on-chain-trading.ts
│   ├── update-simulated-prices.ts
│   └── ...
│
├── test/
│   ├── integration/
│   └── ...
│
├── fixtures/
│   └── market-data-sample.csv
│
├── foundry.toml
├── package.json
├── prisma.config.ts
└── README.md

### 🔒 Security

TradeForge follows several security principles:

Passwords hashed using Argon2id
JWT-based authentication
Private keys never stored in PostgreSQL
Recovery phrases never sent to the backend
Wallet signing performed client-side
No private keys in source code
No private keys in NEXT_PUBLIC_*
No secrets committed to Git
No PII stored on-chain
Smart contracts validate trading operations
Blockchain receipts required before marking trades executed

### ⚠️ Local Blockchain Reset

Anvil is an ephemeral development blockchain unless configured for persistence.

Restarting Anvil normally resets:

Contracts
Wallet registrations
Virtual cash
Holdings
Blockchain transactions
On-chain stock instruments

PostgreSQL data persists independently.

After an Anvil reset, run:

npm run start:local

The launcher will rebuild/redeploy the required blockchain state and remap the stocks.

### 🎓 Academic Purpose

TradeForge demonstrates how blockchain technology can be applied to a stock trading workflow to provide:

Transparent transaction records
Automated trade validation
Smart-contract-based execution
Verifiable ownership state
Tamper-resistant transaction history
Blockchain-based auditability
Reduced dependence on a centralized trading ledger

The project is designed as a simulation and educational demonstration, not as a replacement for regulated stock exchanges or brokerage infrastructure.

### 🗺️ Future Improvements

Potential future extensions include:

Real-time market-data providers
More exchanges and instruments
Advanced order types
Limit-order matching engine
Multi-user order book
Event-driven market simulation
More sophisticated risk management
Advanced portfolio analytics
Persistent blockchain node
Layer-2 deployment
Production-grade wallet security
Regulatory compliance layer

### 👥 Team

Built as an academic blockchain project.

Team Members
Shivang Saxena — Blockchain / Backend
Shreya Agarwal — Frontend
Shivansh Tyagi — Database / Market Simulation
Kanishk Gulati — Testing / Deployment 

### 📜 License

This project is intended for educational and academic purposes.

Add your preferred license here, such as MIT, if you decide to open-source the project.

### ⭐ Project Highlights
⚒️ TradeForge
│
├── ⛓️ Blockchain-powered trading
├── 📈 30 NSE equities
├── 🤖 Realistic market simulation
├── 👛 Custom blockchain wallet
├── 💰 Virtual ₹100,000 trading balance
├── 📊 Portfolio management
├── 📜 On-chain transaction history
├── 🔐 Smart-contract validation
├── 🗄️ PostgreSQL + Prisma
├── ⚡ Next.js + React
├── 🧪 149+ automated tests
└── 🚀 One-command blockchain setup

TradeForge — Forge trades. Verify everything.
