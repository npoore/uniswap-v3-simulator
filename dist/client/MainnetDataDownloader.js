"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainnetDataDownloader = void 0;
const EventType_1 = require("../enum/EventType");
const EventDBManager_1 = require("../manager/EventDBManager");
const ethers_1 = require("ethers");
const UniswapV3Pool2__factory_1 = require("../typechain/factories/UniswapV3Pool2__factory");
const __1 = require("..");
const SQLiteSimulationDataManager_1 = require("../manager/SQLiteSimulationDataManager");
const Serializer_1 = require("../util/Serializer");
const jsbi_1 = __importDefault(require("jsbi"));
const InternalConstants_1 = require("../enum/InternalConstants");
const EventDataSourceType_1 = require("../enum/EventDataSourceType");
const PoolState_1 = require("../model/PoolState");
const ConfigurableCorePool_1 = require("../core/ConfigurableCorePool");
const SimulatorConsoleVisitor_1 = require("../manager/SimulatorConsoleVisitor");
const SimulatorPersistenceVisitor_1 = require("../manager/SimulatorPersistenceVisitor");
const SimulatorRoadmapManager_1 = require("../manager/SimulatorRoadmapManager");
const TunerConfig_1 = require("../config/TunerConfig");
const graphql_request_1 = require("graphql-request");
const BNUtils_1 = require("../util/BNUtils");
class MainnetDataDownloader {
    constructor(RPCProviderUrl, eventDataSourceType) {
        if (RPCProviderUrl == undefined) {
            let tunerConfig = TunerConfig_1.loadConfig(undefined);
            RPCProviderUrl = tunerConfig.RPCProviderUrl;
        }
        this.RPCProvider = new ethers_1.providers.JsonRpcProvider(RPCProviderUrl);
        this.eventDataSourceType = eventDataSourceType;
    }
    async queryDeploymentBlockNumber(poolAddress) {
        // TODO how to know accurate block number on contract deployment?
        // Maybe use etherscan API or scan back mainnet trxs through the first event the contract emitted.
        // BTW, for most cases, it's the same as Initialization event block number. Let's take this now.
        return this.queryInitializationBlockNumber(poolAddress);
    }
    async queryInitializationBlockNumber(poolAddress) {
        let uniswapV3Pool = await this.getCorePoolContarct(poolAddress);
        let initializeTopic = uniswapV3Pool.filters.Initialize();
        let initializationEvent = await uniswapV3Pool.queryFilter(initializeTopic);
        return initializationEvent[0].blockNumber;
    }
    async parseEndBlockTypeWhenInit(toBlock, poolAddress) {
        switch (toBlock) {
            case "latest":
                return (await this.RPCProvider.getBlock("latest")).number;
            case "afterDeployment":
                return await this.queryDeploymentBlockNumber(poolAddress);
            case "afterInitialization":
                return await this.queryInitializationBlockNumber(poolAddress);
            default:
                let latestOnChain = (await this.RPCProvider.getBlock("latest")).number;
                return toBlock > latestOnChain ? latestOnChain : toBlock;
        }
    }
    async parseEndBlockTypeWhenRecover(latestDownloadedEventBlockNumber, toBlock, poolAddress) {
        switch (toBlock) {
            case "latestOnChain":
                return (await this.RPCProvider.getBlock("latest")).number;
            case "latestDownloaded":
                return latestDownloadedEventBlockNumber;
            case "afterDeployment":
                return await this.queryDeploymentBlockNumber(poolAddress);
            case "afterInitialization":
                return await this.queryInitializationBlockNumber(poolAddress);
            default:
                let latestOnChain = (await this.RPCProvider.getBlock("latest")).number;
                return toBlock > latestOnChain ? latestOnChain : toBlock;
        }
    }
    generateMainnetEventDBFilePath(poolName, poolAddress) {
        return `${poolName}_${poolAddress}.db`;
    }
    parseFromMainnetEventDBFilePath(filePath) {
        let databaseName = __1.getDatabaseNameFromPath(filePath, ".db");
        let nameArr = databaseName.split("_");
        return { poolName: nameArr[0], poolAddress: nameArr[1] };
    }
    async download(poolName = "", poolAddress, toBlock, batchSize = 5000) {
        // check toBlock first
        let toBlockAsNumber = await this.parseEndBlockTypeWhenInit(toBlock, poolAddress);
        let uniswapV3Pool = await this.getCorePoolContarct(poolAddress);
        let deploymentBlockNumber = await this.queryDeploymentBlockNumber(poolAddress);
        if (toBlockAsNumber < deploymentBlockNumber)
            throw new Error(`The pool does not exist at block height: ${toBlockAsNumber}, it was deployed at block height: ${deploymentBlockNumber}`);
        let initializeTopic = uniswapV3Pool.filters.Initialize();
        let initializationEvent = await uniswapV3Pool.queryFilter(initializeTopic);
        let initializationSqrtPriceX96 = initializationEvent[0].args.sqrtPriceX96;
        let initializationEventBlockNumber = initializationEvent[0].blockNumber;
        // check db file then
        let filePath = this.generateMainnetEventDBFilePath(poolName, poolAddress);
        if (__1.exists(filePath))
            throw new Error(`The database file: ${filePath} already exists. You can either try to update or delete the database file.`);
        let eventDB = await EventDBManager_1.EventDBManager.buildInstance(filePath);
        try {
            // query and record poolConfig
            let poolConfig = new __1.PoolConfig(await uniswapV3Pool.tickSpacing(), await uniswapV3Pool.token0(), await uniswapV3Pool.token1(), await uniswapV3Pool.fee());
            await eventDB.addPoolConfig(poolConfig);
            await eventDB.saveLatestEventBlockNumber(deploymentBlockNumber);
            if (toBlock === "afterDeployment")
                return;
            // record initialize event
            await eventDB.addInitialSqrtPriceX96(initializationSqrtPriceX96.toString());
            await eventDB.saveInitializationEventBlockNumber(initializationEventBlockNumber);
            await eventDB.saveLatestEventBlockNumber(initializationEventBlockNumber);
            if (toBlock === "afterInitialization")
                return;
            // download events after initialization
            if (this.eventDataSourceType === EventDataSourceType_1.EventDataSourceType.SUBGRAPH) {
                await this.downloadEventsFromSubgraph(poolAddress.toLowerCase(), await this.getTokenDecimals(poolConfig.token0), await this.getTokenDecimals(poolConfig.token1), eventDB, initializationEventBlockNumber, toBlockAsNumber, batchSize);
            }
            else if (this.eventDataSourceType === EventDataSourceType_1.EventDataSourceType.RPC) {
                await this.downloadEventsFromRPC(uniswapV3Pool, eventDB, initializationEventBlockNumber, toBlockAsNumber, batchSize);
            }
            await this.preProcessSwapEvent(eventDB);
        }
        finally {
            await eventDB.close();
        }
    }
    async update(mainnetEventDBFilePath, toBlock, batchSize = 5000) {
        // check dbfile first
        let { poolAddress } = this.parseFromMainnetEventDBFilePath(mainnetEventDBFilePath);
        if (!__1.exists(mainnetEventDBFilePath))
            throw new Error(`The database file: ${mainnetEventDBFilePath} does not exist. Please download the data first.`);
        // check toBlock then
        let eventDB = await EventDBManager_1.EventDBManager.buildInstance(mainnetEventDBFilePath);
        try {
            let latestEventBlockNumber = await eventDB.getLatestEventBlockNumber();
            let deploymentBlockNumber = await this.queryDeploymentBlockNumber(poolAddress);
            let toBlockAsNumber = await this.parseEndBlockTypeWhenRecover(latestEventBlockNumber, toBlock, poolAddress);
            if (toBlockAsNumber < deploymentBlockNumber)
                throw new Error("toBlock is too small, the pool hasn't been deployed.");
            if (toBlockAsNumber < latestEventBlockNumber) {
                console.log("It's already up to date.");
                return;
            }
            let uniswapV3Pool = await this.getCorePoolContarct(poolAddress);
            // check and record initialize event if needed
            let updateInitializationEvent = false;
            let initializationEventBlockNumber = await eventDB.getInitializationEventBlockNumber();
            if (0 == initializationEventBlockNumber) {
                updateInitializationEvent = true;
                let initializeTopic = uniswapV3Pool.filters.Initialize();
                let initializationEvent = await uniswapV3Pool.queryFilter(initializeTopic);
                await eventDB.addInitialSqrtPriceX96(initializationEvent[0].args.sqrtPriceX96.toString());
                initializationEventBlockNumber = initializationEvent[0].blockNumber;
                await eventDB.saveInitializationEventBlockNumber(initializationEventBlockNumber);
                await eventDB.saveLatestEventBlockNumber(initializationEventBlockNumber);
            }
            if (!updateInitializationEvent &&
                toBlockAsNumber == latestEventBlockNumber) {
                console.log("It's already up to date.");
                return;
            }
            let fromBlockAsNumber = updateInitializationEvent
                ? initializationEventBlockNumber
                : latestEventBlockNumber + 1;
            // remove incomplete events
            await eventDB.deleteLiquidityEventsByBlockNumber(EventType_1.EventType.MINT, fromBlockAsNumber, toBlockAsNumber);
            await eventDB.deleteLiquidityEventsByBlockNumber(EventType_1.EventType.BURN, fromBlockAsNumber, toBlockAsNumber);
            await eventDB.deleteSwapEventsByBlockNumber(fromBlockAsNumber, toBlockAsNumber);
            // download events after initialization
            let poolConfig = await eventDB.getPoolConfig();
            if (this.eventDataSourceType === EventDataSourceType_1.EventDataSourceType.SUBGRAPH) {
                await this.downloadEventsFromSubgraph(poolAddress.toLowerCase(), await this.getTokenDecimals(poolConfig.token0), await this.getTokenDecimals(poolConfig.token1), eventDB, fromBlockAsNumber, toBlockAsNumber, batchSize);
            }
            else if (this.eventDataSourceType === EventDataSourceType_1.EventDataSourceType.RPC) {
                await this.downloadEventsFromRPC(uniswapV3Pool, eventDB, fromBlockAsNumber, toBlockAsNumber, batchSize);
            }
            await this.preProcessSwapEvent(eventDB);
        }
        finally {
            await eventDB.close();
        }
    }
    async getTokenDecimals(token) {
        const query = graphql_request_1.gql `
    query {
      token(id:"${token.toLowerCase()}"){
        decimals
      }
    }
  `;
        let data = await graphql_request_1.request(InternalConstants_1.UNISWAP_V3_SUBGRAPH_ENDPOINT, query);
        return data.token.decimals;
    }
    async initializeAndReplayEvents(eventDB, configurableCorePool, endBlock, onlyInitialize = false) {
        let initializationEventBlockNumber = await eventDB.getInitializationEventBlockNumber();
        let initialSqrtPriceX96 = await eventDB.getInitialSqrtPriceX96();
        await configurableCorePool.initialize(initialSqrtPriceX96);
        if (onlyInitialize)
            return configurableCorePool;
        // replay events to find swap input param we need
        let startBlock = initializationEventBlockNumber;
        let currBlock = startBlock;
        while (currBlock <= endBlock) {
            let nextEndBlock = this.nextBatch(currBlock) > endBlock
                ? endBlock
                : this.nextBatch(currBlock);
            let events = await this.getAndSortEventByBlock(eventDB, currBlock, nextEndBlock);
            if (events.length > 0) {
                await this.replayEventsAndAssertReturnValues(eventDB, configurableCorePool, events);
            }
            currBlock = nextEndBlock + 1;
        }
        return configurableCorePool;
    }
    async downloadEventsFromSubgraph(poolAddress, token0Decimals, token1Decimals, eventDB, fromBlock, toBlock, batchSize) {
        while (fromBlock <= toBlock) {
            let endBlock = fromBlock + batchSize > toBlock ? toBlock : fromBlock + batchSize;
            let latestEventBlockNumber = Math.max(await this.saveEventsFromSubgraph(poolAddress, token0Decimals, token1Decimals, eventDB, EventType_1.EventType.MINT, fromBlock, endBlock), await this.saveEventsFromSubgraph(poolAddress, token0Decimals, token1Decimals, eventDB, EventType_1.EventType.BURN, fromBlock, endBlock), await this.saveEventsFromSubgraph(poolAddress, token0Decimals, token1Decimals, eventDB, EventType_1.EventType.SWAP, fromBlock, endBlock));
            await eventDB.saveLatestEventBlockNumber(latestEventBlockNumber);
            fromBlock += batchSize + 1;
        }
        console.log("Events have been downloaded successfully. Please wait for pre-process to be done...");
    }
    async downloadEventsFromRPC(uniswapV3Pool, eventDB, fromBlock, toBlock, batchSize) {
        while (fromBlock <= toBlock) {
            let endBlock = fromBlock + batchSize > toBlock ? toBlock : fromBlock + batchSize;
            let latestEventBlockNumber = Math.max(await this.saveEventsFromRPC(uniswapV3Pool, eventDB, EventType_1.EventType.MINT, fromBlock, endBlock), await this.saveEventsFromRPC(uniswapV3Pool, eventDB, EventType_1.EventType.BURN, fromBlock, endBlock), await this.saveEventsFromRPC(uniswapV3Pool, eventDB, EventType_1.EventType.SWAP, fromBlock, endBlock));
            await eventDB.saveLatestEventBlockNumber(latestEventBlockNumber);
            fromBlock += batchSize + 1;
        }
        console.log("Events have been downloaded successfully. Please wait for pre-process to be done...");
    }
    async saveEventsFromSubgraph(poolAddress, token0Decimals, token1Decimals, eventDB, eventType, fromBlock, toBlock) {
        let fromTimestamp = (await this.RPCProvider.getBlock(fromBlock)).timestamp;
        let toTimestamp = (await this.RPCProvider.getBlock(toBlock)).timestamp;
        let latestEventBlockNumber = fromBlock;
        let skip = 0;
        while (true) {
            if (eventType === EventType_1.EventType.MINT) {
                const query = graphql_request_1.gql `
        query {
          pool(id: "${poolAddress}") {
            mints(
              first: 1000
              skip: ${skip}
              where: { timestamp_gte: ${fromTimestamp}, timestamp_lte: ${toTimestamp} }
              orderBy: timestamp
              orderDirection: asc
            ) {
              sender
              owner
              amount
              amount0
              amount1
              tickLower
              tickUpper
              transaction {
                blockNumber
              }
              logIndex
              timestamp
            }
          }
        }
      `;
                let data = await graphql_request_1.request(InternalConstants_1.UNISWAP_V3_SUBGRAPH_ENDPOINT, query);
                let events = data.pool.mints;
                for (let event of events) {
                    let date = new Date(event.timestamp * 1000);
                    await eventDB.insertLiquidityEvent(eventType, event.sender, event.owner, event.amount.toString(), BNUtils_1.convertTokenStrFromDecimal(event.amount0.toString(), token0Decimals), BNUtils_1.convertTokenStrFromDecimal(event.amount1.toString(), token1Decimals), event.tickLower, event.tickUpper, event.transaction.blockNumber, 0, event.logIndex, date);
                    latestEventBlockNumber = event.transaction.blockNumber;
                }
                if (events.length < 1000) {
                    break;
                }
                else {
                    skip += 1000;
                }
            }
            else if (eventType === EventType_1.EventType.BURN) {
                const query = graphql_request_1.gql `
        query {
          pool(id: "${poolAddress}") {
            burns(
              first: 1000
              skip: ${skip}
              where: { timestamp_gte: ${fromTimestamp}, timestamp_lte: ${toTimestamp} }
              orderBy: timestamp
              orderDirection: asc
            ) {
              owner
              amount
              amount0
              amount1
              tickLower
              tickUpper
              transaction {
                blockNumber
              }
              logIndex
              timestamp
            }
          }
        }
      `;
                let data = await graphql_request_1.request(InternalConstants_1.UNISWAP_V3_SUBGRAPH_ENDPOINT, query);
                let events = data.pool.burns;
                for (let event of events) {
                    let date = new Date(event.timestamp * 1000);
                    await eventDB.insertLiquidityEvent(eventType, event.owner, "", event.amount.toString(), BNUtils_1.convertTokenStrFromDecimal(event.amount0.toString(), token0Decimals), BNUtils_1.convertTokenStrFromDecimal(event.amount1.toString(), token1Decimals), event.tickLower, event.tickUpper, event.transaction.blockNumber, 0, event.logIndex, date);
                    latestEventBlockNumber = event.transaction.blockNumber;
                }
                if (events.length < 1000) {
                    break;
                }
                else {
                    skip += 1000;
                }
            }
            else if (eventType === EventType_1.EventType.SWAP) {
                const query = graphql_request_1.gql `
          query {
            pool(id: "${poolAddress}") {
              swaps(
                first: 1000
                skip: ${skip}
                where: { timestamp_gte: ${fromTimestamp}, timestamp_lte: ${toTimestamp} }
                orderBy: timestamp
                orderDirection: asc
              ) {
                sender
                recipient
                amount0
                amount1
                sqrtPriceX96
                tick
                transaction {
                  blockNumber
                }
                logIndex
                timestamp
              }
            }
          }
        `;
                let data = await graphql_request_1.request(InternalConstants_1.UNISWAP_V3_SUBGRAPH_ENDPOINT, query);
                let events = data.pool.swaps;
                for (let event of events) {
                    let date = new Date(event.timestamp * 1000);
                    await eventDB.insertSwapEvent(event.sender, event.recipient, BNUtils_1.convertTokenStrFromDecimal(event.amount0.toString(), token0Decimals), BNUtils_1.convertTokenStrFromDecimal(event.amount1.toString(), token1Decimals), event.sqrtPriceX96.toString(), "-1", event.tick, event.transaction.blockNumber, 0, event.logIndex, date);
                    latestEventBlockNumber = event.transaction.blockNumber;
                }
                if (events.length < 1000) {
                    break;
                }
                else {
                    skip += 1000;
                }
            }
        }
        return latestEventBlockNumber;
    }
    async saveEventsFromRPC(uniswapV3Pool, eventDB, eventType, fromBlock, toBlock) {
        let latestEventBlockNumber = fromBlock;
        if (eventType === EventType_1.EventType.MINT) {
            let topic = uniswapV3Pool.filters.Mint();
            let events = await uniswapV3Pool.queryFilter(topic, fromBlock, toBlock);
            for (let event of events) {
                let block = await this.RPCProvider.getBlock(event.blockNumber);
                let date = new Date(block.timestamp * 1000);
                await eventDB.insertLiquidityEvent(eventType, event.args.sender, event.args.owner, event.args.amount.toString(), event.args.amount0.toString(), event.args.amount1.toString(), event.args.tickLower, event.args.tickUpper, event.blockNumber, event.transactionIndex, event.logIndex, date);
                if (event.blockNumber > latestEventBlockNumber)
                    latestEventBlockNumber = event.blockNumber;
            }
        }
        else if (eventType === EventType_1.EventType.BURN) {
            let topic = uniswapV3Pool.filters.Burn();
            let events = await uniswapV3Pool.queryFilter(topic, fromBlock, toBlock);
            for (let event of events) {
                let block = await this.RPCProvider.getBlock(event.blockNumber);
                let date = new Date(block.timestamp * 1000);
                await eventDB.insertLiquidityEvent(eventType, event.args.owner, "", event.args.amount.toString(), event.args.amount0.toString(), event.args.amount1.toString(), event.args.tickLower, event.args.tickUpper, event.blockNumber, event.transactionIndex, event.logIndex, date);
                if (event.blockNumber > latestEventBlockNumber)
                    latestEventBlockNumber = event.blockNumber;
            }
        }
        else if (eventType === EventType_1.EventType.SWAP) {
            let topic = uniswapV3Pool.filters.Swap();
            let events = await uniswapV3Pool.queryFilter(topic, fromBlock, toBlock);
            for (let event of events) {
                let block = await this.RPCProvider.getBlock(event.blockNumber);
                let date = new Date(block.timestamp * 1000);
                await eventDB.insertSwapEvent(event.args.sender, event.args.recipient, event.args.amount0.toString(), event.args.amount1.toString(), event.args.sqrtPriceX96.toString(), event.args.liquidity.toString(), event.args.tick, event.blockNumber, event.transactionIndex, event.logIndex, date);
                if (event.blockNumber > latestEventBlockNumber)
                    latestEventBlockNumber = event.blockNumber;
            }
        }
        return latestEventBlockNumber;
    }
    async preProcessSwapEvent(eventDB) {
        // initialize configurableCorePool
        let simulatorDBManager = await SQLiteSimulationDataManager_1.SQLiteSimulationDataManager.buildInstance();
        let poolConfig = await eventDB.getPoolConfig();
        let configurableCorePool = new ConfigurableCorePool_1.ConfigurableCorePool(new PoolState_1.PoolState(poolConfig), new SimulatorRoadmapManager_1.SimulatorRoadmapManager(simulatorDBManager), new SimulatorConsoleVisitor_1.SimulatorConsoleVisitor(), new SimulatorPersistenceVisitor_1.SimulatorPersistenceVisitor(simulatorDBManager));
        await this.initializeAndReplayEvents(eventDB, configurableCorePool, await eventDB.getLatestEventBlockNumber());
        await simulatorDBManager.close();
        console.log("Events have been pre-processed successfully.");
    }
    nextBatch(currBlock) {
        // we take a day as step length, consider block interval as 40s then 24 * 60 * 60 / 40 = 2160
        return currBlock + 2160;
    }
    async getCorePoolContarct(poolAddress) {
        return UniswapV3Pool2__factory_1.UniswapV3Pool2__factory.connect(poolAddress, this.RPCProvider);
    }
    async getAndSortEventByBlock(eventDB, startBlock, endBlock) {
        let events = [];
        let mintEvents = await eventDB.getLiquidityEventsByBlockNumber(EventType_1.EventType.MINT, startBlock, endBlock);
        let burnEvents = await eventDB.getLiquidityEventsByBlockNumber(EventType_1.EventType.BURN, startBlock, endBlock);
        let swapEvents = await eventDB.getSwapEventsByBlockNumber(startBlock, endBlock);
        events.push(...mintEvents);
        events.push(...burnEvents);
        events.push(...swapEvents);
        events.sort(function (a, b) {
            return a.blockNumber == b.blockNumber
                ? a.logIndex - b.logIndex
                : a.blockNumber - b.blockNumber;
        });
        return events;
    }
    async replayEventsAndAssertReturnValues(eventDB, configurableCorePool, paramArr) {
        for (let index = 0; index < paramArr.length; index++) {
            // avoid stack overflow
            if (index % 4000 == 0) {
                configurableCorePool.takeSnapshot("");
            }
            let param = paramArr[index];
            let amount0, amount1;
            switch (param.type) {
                case EventType_1.EventType.MINT:
                    ({ amount0, amount1 } = await configurableCorePool.mint(param.recipient, param.tickLower, param.tickUpper, param.liquidity));
                    if (jsbi_1.default.notEqual(amount0, param.amount0) ||
                        jsbi_1.default.notEqual(amount1, param.amount1))
                        throw new Error(`Mint failed. Event index: ${index}. Event: ${Serializer_1.printParams(param)}.`);
                    break;
                case EventType_1.EventType.BURN:
                    ({ amount0, amount1 } = await configurableCorePool.burn(param.msgSender, param.tickLower, param.tickUpper, param.liquidity));
                    if (jsbi_1.default.notEqual(amount0, param.amount0) ||
                        jsbi_1.default.notEqual(amount1, param.amount1))
                        throw new Error(`Mint failed. Event index: ${index}. Event: ${Serializer_1.printParams(param)}.`);
                    break;
                case EventType_1.EventType.SWAP:
                    // try-error to find `amountSpecified` and `sqrtPriceLimitX96` to resolve to the same result as swap event records
                    try {
                        let { amountSpecified, sqrtPriceX96 } = await configurableCorePool.resolveInputFromSwapResultEvent(param);
                        let zeroForOne = jsbi_1.default.greaterThan(param.amount0, InternalConstants_1.ZERO)
                            ? true
                            : false;
                        await configurableCorePool.swap(zeroForOne, amountSpecified, sqrtPriceX96);
                        // add AmountSpecified column to swap event if we need to
                        if (InternalConstants_1.ZERO == param.amountSpecified) {
                            await eventDB.addAmountSpecified(param.id, amountSpecified.toString());
                        }
                    }
                    catch (error) {
                        return Promise.reject(`Swap failed. Event index: ${index}. Event: ${Serializer_1.printParams(param)}.`);
                    }
                    break;
                default:
                    // @ts-ignore: ExhaustiveCheck
                    const exhaustiveCheck = param;
            }
        }
    }
}
exports.MainnetDataDownloader = MainnetDataDownloader;
