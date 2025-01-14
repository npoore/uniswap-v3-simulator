import { SimulationDataManager } from "../interface/SimulationDataManager";
import { PoolState } from "../model/PoolState";
import { Snapshot } from "../entity/Snapshot";
import { Roadmap } from "../model/Roadmap";
import { SnapshotProfile } from "../entity/SnapshotProfile";
import { PoolConfig } from "../model/PoolConfig";
export declare class SQLiteSimulationDataManager implements SimulationDataManager {
    private knex;
    private constructor();
    static buildInstance(dbPath?: string): Promise<SimulationDataManager>;
    initTables(): Promise<void>;
    persistRoadmap(roadmap: Roadmap): Promise<number>;
    persistSnapshot(poolState: PoolState): Promise<number>;
    getSnapshotProfiles(): Promise<SnapshotProfile[]>;
    getSnapshots(snapshotIds: number[]): Promise<Snapshot[]>;
    getSnapshot(snapshotId: string): Promise<Snapshot | undefined>;
    getPoolConfig(poolConfigId: string): Promise<PoolConfig | undefined>;
    getRoadmap(roadmapId: string): Promise<Roadmap | undefined>;
    close(): Promise<void>;
    private readSnapshot;
    private readSnapshots;
    private readSnapshotProfiles;
    private insertSnapshot;
    private insertRoadmap;
    private readRoadmap;
    private readPoolConfig;
    private insertPoolConfig;
    private deserializeSnapshot;
    private getBuilderContext;
}
