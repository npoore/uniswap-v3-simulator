import { providers } from "ethers";
import { loadConfig } from "../config/TunerConfig";
import { exists } from "../util/FileUtils";
import { UniswapV3Pool2__factory as UniswapV3PoolFactory } from "../typechain/factories/UniswapV3Pool2__factory";
import { UniswapV3Pool2 as UniswapV3Pool } from "../typechain/UniswapV3Pool2";
import { EventDBManager, LiquidityEventInsertRecord, SwapEventInsertRecord } from "../manager/EventDBManager";
import { PoolConfig } from "../model/PoolConfig";
import fs from "fs";
import path from "path";
import { SimulationDataManager } from "../interface/SimulationDataManager";
import { SQLiteSimulationDataManager } from "../manager/SQLiteSimulationDataManager";
import { ConfigurableCorePool } from "../interface/ConfigurableCorePool";
import { ConfigurableCorePool as ConfigurableCorePoolImpl } from "../core/ConfigurableCorePool";
import { PoolState } from "../model/PoolState";
import { SimulatorRoadmapManager } from "../manager/SimulatorRoadmapManager";
import { SimulatorConsoleVisitor } from "../manager/SimulatorConsoleVisitor";
import { SimulatorPersistenceVisitor } from "../manager/SimulatorPersistenceVisitor";
import { LiquidityEvent } from "../entity/LiquidityEvent";
import { EventType } from "../enum/EventType";
import { SwapEvent } from "../entity/SwapEvent";
import JSBI from "jsbi";
import { ZERO } from "../enum/InternalConstants";
import { format, printParams } from "../util";




const BATCH_INSERT_SIZE: number = 200;

export class LoadData {
    private RPCProvider: providers.JsonRpcProvider;

    constructor(
        RPCProviderUrl: string | undefined,
    ) {
        if (RPCProviderUrl == undefined) {
        let tunerConfig = loadConfig(undefined);
        RPCProviderUrl = tunerConfig.RPCProviderUrl;
        }
        this.RPCProvider = new providers.JsonRpcProvider(RPCProviderUrl);
    }

    async processData(
        poolName: string,
        poolAddress: string,
        swaps: string,
        mints: string,
        burns: string
    ) {

        

        let uniswapV3Pool = await this.getCorePoolContarct(poolAddress);

        let initializeTopic = uniswapV3Pool.filters.Initialize();
        let initializationEvent = await uniswapV3Pool.queryFilter(initializeTopic);
        let initializationSqrtPriceX96 = initializationEvent[0].args.sqrtPriceX96;
        let initializationEventBlockNumber = initializationEvent[0].blockNumber;

        let filePath = this.generateMainnetEventDBFilePath(poolName, poolAddress);
        let init = false;
        if (!exists(filePath)) init = true;
        
        let eventDB = await EventDBManager.buildInstance(filePath);
        if (init) {
            // query and record poolConfig
            let poolConfig = new PoolConfig(
                await uniswapV3Pool.tickSpacing(),
                await uniswapV3Pool.token0(),
                await uniswapV3Pool.token1(),
                await uniswapV3Pool.fee()
            );
            await eventDB.addPoolConfig(poolConfig);
            await eventDB.saveLatestEventBlockNumber(initializationEventBlockNumber);
        
            // record initialize event
            await eventDB.addInitialSqrtPriceX96(
                initializationSqrtPriceX96.toString()
            );
            await eventDB.saveInitializationEventBlockNumber(
                initializationEventBlockNumber
            );
            await eventDB.saveLatestEventBlockNumber(initializationEventBlockNumber);
        }

        await this.saveSwapEvents(uniswapV3Pool,eventDB,swaps);
        console.log("swaps loaded")
        await this.saveMintEvents(uniswapV3Pool,eventDB,mints);
        console.log("mints loaded");
        await this.saveBurnEvents(uniswapV3Pool,eventDB,burns);
        console.log("burns loaded");

        let swap_block: number = await eventDB.getLastSwapEventBlock();
        let liquidity_block: number = await eventDB.getLastLiqudityEventBlock();

        if (swap_block > liquidity_block) await eventDB.saveLatestEventBlockNumber(liquidity_block);
        else await eventDB.saveLatestEventBlockNumber(swap_block);

        await this.preProcessSwapEvent(eventDB);

        await eventDB.close();
        

    }

    async saveSwapEvents(
        uniswapV3Pool: UniswapV3Pool,
        eventDB: EventDBManager,
        swapEvents: string
    ) {
        let data = fs.readFileSync(path.join(process.cwd(),swapEvents))
        let d = JSON.parse(data.toString());
        let swaps: SwapEventInsertRecord[] = new Array();
        for ( let row of d['data']['get_result_by_job_id']) {
            let block_number = row['data']['block_number'];
            let date = row['data']['date'];
            let log_index = row['data']['log_index'];
            let transaction_index = row['data']['transaction_index'];
            let msg_sender = row['data']['msg_sender'];
            let recipient = row['data']['recipient'];
      
            let data: string = '0' + row['data']['data'].substring(1);
            let result = uniswapV3Pool.interface.decodeEventLog(uniswapV3Pool.interface.events["Swap(address,address,int256,int256,uint160,uint128,int24)"],data);
            swaps.push({
                msg_sender: msg_sender,
                recipient: recipient,
                amount0: result.amount0.toString(),
                amount1: result.amount1.toString(),
                amount_specified: undefined,
                sqrt_price_x96: result.sqrtPriceX96.toString(),
                liquidity: result.liquidity.toString(),
                tick: result.tick,
                block_number: block_number,
                transaction_index: transaction_index,
                log_index: log_index,
                date: format(new Date(date), "yyyy-MM-dd HH:mm:ss")
            })
            if (swaps.length >= BATCH_INSERT_SIZE) {
                await eventDB.insertSwapEvents(swaps);
                swaps = new Array();
            }
        }
        await eventDB.insertSwapEvents(swaps);
            
    }

    async saveMintEvents(
        uniswapV3Pool: UniswapV3Pool,
        eventDB: EventDBManager,
        mints: string    ) {
        let data = fs.readFileSync(path.join(process.cwd(),mints))
        let d = JSON.parse(data.toString());
        let events: LiquidityEventInsertRecord[] = new Array();
        for ( let row of d['data']['get_result_by_job_id']) {
            let block_number = row['data']['block_number'];
            let date = row['data']['date'];
            let log_index = row['data']['log_index'];
            let transaction_index = row['data']['transaction_index'];
            let recipient = row['data']['recipient'];
            let tickUpper = row['data']['tickupper'];
            let tickLower = row['data']['ticklower'];
      
            let data: string = '0' + row['data']['data'].substring(1);
            let result = uniswapV3Pool.interface.decodeEventLog(uniswapV3Pool.interface.events["Mint(address,address,int24,int24,uint128,uint256,uint256)"],data);
            events.push({
                type: 1,
                msg_sender: result.sender,
                recipient: recipient,
                liquidity: result.amount.toString(),
                amount0: result.amount0.toString(),
                amount1: result.amount1.toString(),
                tick_lower: tickLower,
                tick_upper: tickUpper,
                block_number: block_number,
                transaction_index: transaction_index,
                log_index: log_index,
                date: format(new Date(date), "yyyy-MM-dd HH:mm:ss")
            })
            if (events.length >= BATCH_INSERT_SIZE) {
                await eventDB.insertLiquidityEvents(events);
                events = new Array();
            }
        }
        await eventDB.insertLiquidityEvents(events);

    }

    async saveBurnEvents(
        uniswapV3Pool: UniswapV3Pool,
        eventDB: EventDBManager,
        burns: string    ) {
       

            
        let data = fs.readFileSync(path.join(process.cwd(),burns))
        let d = JSON.parse(data.toString());
        let events: LiquidityEventInsertRecord[] = new Array();
        for ( let row of d['data']['get_result_by_job_id']) {
            let block_number = row['data']['block_number'];
            let date = row['data']['date'];
            let log_index = row['data']['log_index'];
            let transaction_index = row['data']['transaction_index'];
            let tickUpper = row['data']['tickupper'];
            let tickLower = row['data']['ticklower'];
            let msg_sender = row['data']['msg_sender'];
    
            let data: string = '0' + row['data']['data'].substring(1);
            let result = uniswapV3Pool.interface.decodeEventLog(uniswapV3Pool.interface.events["Burn(address,int24,int24,uint128,uint256,uint256)"],data);
            events.push({
                type: 2,
                msg_sender: msg_sender,
                recipient: '',
                liquidity: result.amount.toString(),
                amount0: result.amount0.toString(),
                amount1: result.amount1.toString(),
                tick_lower: tickLower,
                tick_upper: tickUpper,
                block_number: block_number,
                transaction_index: transaction_index,
                log_index: log_index,
                date: format(new Date(date), "yyyy-MM-dd HH:mm:ss")
            })
            if (events.length >= BATCH_INSERT_SIZE) {
                await eventDB.insertLiquidityEvents(events);
                events = new Array();
            }
        }
        await eventDB.insertLiquidityEvents(events);
        

    }

    private async getCorePoolContarct(
        poolAddress: string
    ): Promise<UniswapV3Pool> {
        return UniswapV3PoolFactory.connect(poolAddress, this.RPCProvider);
    }

    generateMainnetEventDBFilePath(
        poolName: string,
        poolAddress: string
    ): string {
        return `${poolName}_${poolAddress}.db`;
    }

    private async preProcessSwapEvent(eventDB: EventDBManager) {
        // initialize configurableCorePool
        let simulatorDBManager: SimulationDataManager =
          await SQLiteSimulationDataManager.buildInstance();
        let poolConfig = await eventDB.getPoolConfig();
        let configurableCorePool: ConfigurableCorePool =
          new ConfigurableCorePoolImpl(
            new PoolState(poolConfig),
            new SimulatorRoadmapManager(simulatorDBManager),
            new SimulatorConsoleVisitor(),
            new SimulatorPersistenceVisitor(simulatorDBManager)
          );
        await this.initializeAndReplayEvents(
          eventDB,
          configurableCorePool,
          await eventDB.getLatestEventBlockNumber()
        );
        await simulatorDBManager.close();
        console.log("Events have been pre-processed successfully.");
      }

      async initializeAndReplayEvents(
        eventDB: EventDBManager,
        configurableCorePool: ConfigurableCorePool,
        endBlock: number,
        onlyInitialize: boolean = false
      ): Promise<ConfigurableCorePool> {
        let initializationEventBlockNumber =
          await eventDB.getInitializationEventBlockNumber();
    
        let initialSqrtPriceX96 = await eventDB.getInitialSqrtPriceX96();
        await configurableCorePool.initialize(initialSqrtPriceX96);
    
        if (onlyInitialize) return configurableCorePool;
    
        // replay events to find swap input param we need
        let startBlock = initializationEventBlockNumber;
        let currBlock = startBlock;
    
        while (currBlock <= endBlock) {
          let nextEndBlock =
            this.nextBatch(currBlock) > endBlock
              ? endBlock
              : this.nextBatch(currBlock);
          let events = await this.getAndSortEventByBlock(
            eventDB,
            currBlock,
            nextEndBlock
          );
          if (events.length > 0) {
            await this.replayEventsAndAssertReturnValues(
              eventDB,
              configurableCorePool,
              events
            );
          }
          currBlock = nextEndBlock + 1;
        }
        return configurableCorePool;
      }

      private nextBatch(currBlock: number) {
        // we take a day as step length, consider block interval as 40s then 24 * 60 * 60 / 40 = 2160
        return currBlock + 2160;
      }

      private async getAndSortEventByBlock(
        eventDB: EventDBManager,
        startBlock: number,
        endBlock: number
      ): Promise<(LiquidityEvent | SwapEvent)[]> {
        let events: (LiquidityEvent | SwapEvent)[] = [];
        let mintEvents: LiquidityEvent[] =
          await eventDB.getLiquidityEventsByBlockNumber(
            EventType.MINT,
            startBlock,
            endBlock
          );
        let burnEvents: LiquidityEvent[] =
          await eventDB.getLiquidityEventsByBlockNumber(
            EventType.BURN,
            startBlock,
            endBlock
          );
        let swapEvents: SwapEvent[] = await eventDB.getSwapEventsByBlockNumber(
          startBlock,
          endBlock
        );
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

      private async replayEventsAndAssertReturnValues(
        eventDB: EventDBManager,
        configurableCorePool: ConfigurableCorePool,
        paramArr: (LiquidityEvent | SwapEvent)[]
      ): Promise<void> {
        for (let index = 0; index < paramArr.length; index++) {
          // avoid stack overflow
          if (index % 4000 == 0) {
            configurableCorePool.takeSnapshot("");
          }
    
          let param = paramArr[index];
          let amount0: JSBI, amount1: JSBI;
          switch (param.type) {
            case EventType.MINT:
              ({ amount0, amount1 } = await configurableCorePool.mint(
                param.recipient,
                param.tickLower,
                param.tickUpper,
                param.liquidity
              ));
              if (
                JSBI.notEqual(amount0, param.amount0) ||
                JSBI.notEqual(amount1, param.amount1)
              )
                throw new Error(
                  `Mint failed. Event index: ${index}. Event: ${printParams(
                    param
                  )}.`
                );
              break;
            case EventType.BURN:
              ({ amount0, amount1 } = await configurableCorePool.burn(
                param.msgSender,
                param.tickLower,
                param.tickUpper,
                param.liquidity
              ));
              if (
                JSBI.notEqual(amount0, param.amount0) ||
                JSBI.notEqual(amount1, param.amount1)
              )
                throw new Error(
                  `Mint failed. Event index: ${index}. Event: ${printParams(
                    param
                  )}.`
                );
              break;
            case EventType.SWAP:
              // try-error to find `amountSpecified` and `sqrtPriceLimitX96` to resolve to the same result as swap event records
              try {
                let { amountSpecified, sqrtPriceX96 } =
                  await configurableCorePool.resolveInputFromSwapResultEvent(param);
    
                let zeroForOne: boolean = JSBI.greaterThan(param.amount0, ZERO)
                  ? true
                  : false;
                await configurableCorePool.swap(
                  zeroForOne,
                  amountSpecified,
                  sqrtPriceX96
                );
                // add AmountSpecified column to swap event if we need to
                if (ZERO == param.amountSpecified) {
                  await eventDB.addAmountSpecified(
                    param.id,
                    amountSpecified.toString()
                  );
                }
              } catch (error) {
                return Promise.reject(
                  `Swap failed. Event index: ${index}. Event: ${printParams(
                    param
                  )}.`
                );
              }
              break;
            default:
              // @ts-ignore: ExhaustiveCheck
              const exhaustiveCheck: never = param;
          }
        }
      }
    
}