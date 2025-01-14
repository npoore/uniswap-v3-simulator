import { LiquidityEvent } from "../entity/LiquidityEvent";
import { SwapEvent } from "../entity/SwapEvent";
import { PoolConfig } from "../model/PoolConfig";
import JSBI from "jsbi";
export declare class EventDBManager {
    private knex;
    private constructor();
    static buildInstance(dbPath?: string): Promise<EventDBManager>;
    initTables(): Promise<void>;
    getPoolConfig(): Promise<PoolConfig | undefined>;
    getInitializationEventBlockNumber(): Promise<number>;
    getLatestEventBlockNumber(): Promise<number>;
    getInitialSqrtPriceX96(): Promise<JSBI>;
    getFirstLiquidityEvent(): Promise<LiquidityEvent>;
    getLiquidityEventsByDate(type: number, startDate: string, endDate: string): Promise<LiquidityEvent[]>;
    getSwapEventsByDate(startDate: string, endDate: string): Promise<SwapEvent[]>;
    getLiquidityEventsByBlockNumber(type: number, fromBlock: number, toBlock: number): Promise<LiquidityEvent[]>;
    deleteLiquidityEventsByBlockNumber(type: number, fromBlock: number, toBlock: number): Promise<void>;
    getSwapEventsByBlockNumber(fromBlock: number, toBlock: number): Promise<SwapEvent[]>;
    deleteSwapEventsByBlockNumber(fromBlock: number, toBlock: number): Promise<void>;
    addPoolConfig(poolConfig: PoolConfig): Promise<number>;
    addAmountSpecified(id: number, amountSpecified: string): Promise<number>;
    addInitialSqrtPriceX96(initialSqrtPriceX96: string): Promise<number>;
    saveLatestEventBlockNumber(latestEventBlockNumber: number): Promise<number>;
    saveInitializationEventBlockNumber(initializationEventBlockNumber: number): Promise<number>;
    insertLiquidityEvent(type: number, msg_sender: string, recipient: string, liquidity: string, amount0: string, amount1: string, tick_lower: number, tick_upper: number, block_number: number, transaction_index: number, log_index: number, date: Date): Promise<number>;
    insertSwapEvent(msg_sender: string, recipient: string, amount0: string, amount1: string, sqrt_price_x96: string, liquidity: string, tick: number, block_number: number, transaction_index: number, log_index: number, date: Date): Promise<number>;
    close(): Promise<void>;
    private readPoolConfig;
    private queryLiquidityEventsByDate;
    private querySwapEventsByDate;
    private queryLiquidityEventsByBlockNumber;
    private querySwapEventsByBlockNumber;
    private insertPoolConfig;
    private updateAmountSpecified;
    private updateInitialSqrtPriceX96;
    private updateLatestEventBlockNumber;
    private updateInitializationEventBlockNumber;
    private deserializeLiquidityEvent;
    private deserializeSwapEvent;
    private getBuilderContext;
}
