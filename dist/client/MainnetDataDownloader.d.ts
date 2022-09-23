import { EventDBManager } from "../manager/EventDBManager";
import { ConfigurableCorePool } from "..";
import { EventDataSourceType } from "../enum/EventDataSourceType";
import { EndBlockTypeWhenInit, EndBlockTypeWhenRecover } from "../entity/EndBlockType";
export declare class MainnetDataDownloader {
    private RPCProvider;
    private eventDataSourceType;
    constructor(RPCProviderUrl: string | undefined, eventDataSourceType: EventDataSourceType);
    queryDeploymentBlockNumber(poolAddress: string): Promise<number>;
    queryInitializationBlockNumber(poolAddress: string): Promise<number>;
    parseEndBlockTypeWhenInit(toBlock: EndBlockTypeWhenInit, poolAddress: string): Promise<number>;
    parseEndBlockTypeWhenRecover(latestDownloadedEventBlockNumber: number, toBlock: EndBlockTypeWhenRecover, poolAddress: string): Promise<number>;
    generateMainnetEventDBFilePath(poolName: string, poolAddress: string): string;
    parseFromMainnetEventDBFilePath(filePath: string): {
        poolName: string;
        poolAddress: string;
    };
    download(poolName: string | undefined, poolAddress: string, toBlock: EndBlockTypeWhenInit, batchSize?: number): Promise<void>;
    update(mainnetEventDBFilePath: string, toBlock: EndBlockTypeWhenRecover, batchSize?: number): Promise<void>;
    private getTokenDecimals;
    initializeAndReplayEvents(eventDB: EventDBManager, configurableCorePool: ConfigurableCorePool, endBlock: number, onlyInitialize?: boolean): Promise<ConfigurableCorePool>;
    private downloadEventsFromSubgraph;
    private downloadEventsFromRPC;
    private saveEventsFromSubgraph;
    private saveEventsFromRPC;
    private preProcessSwapEvent;
    private nextBatch;
    private getCorePoolContarct;
    private getAndSortEventByBlock;
    private replayEventsAndAssertReturnValues;
}
