"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteSimulationDataManager = void 0;
const TickManager_1 = require("./TickManager");
const PositionManager_1 = require("./PositionManager");
const knex_1 = require("knex");
const Serializer_1 = require("../util/Serializer");
const DateConverter_1 = require("../util/DateConverter");
const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss.SSS";
class SQLiteSimulationDataManager {
    constructor(dbPath) {
        const config = {
            client: "sqlite3",
            connection: {
                filename: dbPath, //:memory:
            },
            // sqlite does not support inserting default values. Set the `useNullAsDefault` flag to hide the warning.
            useNullAsDefault: true,
        };
        this.knex = knex_1.knex(config);
    }
    static async buildInstance(dbPath = ":memory:") {
        let dbManager = new SQLiteSimulationDataManager(dbPath);
        await dbManager.initTables();
        return dbManager;
    }
    initTables() {
        const knex = this.knex;
        let tasks = [
            knex.schema.hasTable("poolConfig").then((exists) => !exists
                ? knex.schema.createTable("poolConfig", function (t) {
                    t.increments("id").primary();
                    t.string("poolConfigId", 32);
                    t.string("token0", 255);
                    t.string("token1", 255);
                    t.integer("fee");
                    t.integer("tickSpacing");
                    t.text("timestamp");
                })
                : Promise.resolve()),
            knex.schema.hasTable("snapshot").then((exists) => !exists
                ? knex.schema.createTable("snapshot", function (t) {
                    t.increments("id").primary();
                    t.string("snapshotId", 32);
                    t.string("poolConfigId", 32);
                    t.string("description", 255);
                    t.string("token0Balance", 255);
                    t.string("token1Balance", 255);
                    t.string("sqrtPriceX96", 255);
                    t.string("liquidity", 255);
                    t.integer("tickCurrent");
                    t.string("feeGrowthGlobal0X128", 255);
                    t.string("feeGrowthGlobal1X128", 255);
                    t.string("tickManager");
                    t.string("positionManager");
                    t.text("timestamp");
                })
                : Promise.resolve()),
            knex.schema.hasTable("roadmap").then((exists) => !exists
                ? knex.schema.createTable("roadmap", function (t) {
                    t.increments("id").primary();
                    t.string("roadmapId", 32);
                    t.string("description", 255);
                    t.string("snapshots", 255);
                    t.text("timestamp");
                })
                : Promise.resolve()),
        ];
        return Promise.all(tasks).then(() => Promise.resolve());
    }
    persistRoadmap(roadmap) {
        return this.knex
            .transaction((trx) => this.insertRoadmap(roadmap.id, roadmap.description, roadmap.snapshots, roadmap.timestamp, trx))
            .then((ids) => Promise.resolve(ids[0]));
    }
    persistSnapshot(poolState) {
        let poolConfigId = poolState.poolConfig.id;
        let snapshot = poolState.snapshot;
        return this.knex.transaction((trx) => this.readPoolConfig(poolConfigId, trx)
            .then((poolConfig) => !poolConfig
            ? this.insertPoolConfig(poolState.poolConfig, trx)
            : Promise.resolve([]))
            .then(() => this.insertSnapshot(snapshot.id, poolConfigId, snapshot.description, snapshot.token0Balance, snapshot.token1Balance, snapshot.sqrtPriceX96, snapshot.liquidity, snapshot.tickCurrent, snapshot.feeGrowthGlobal0X128, snapshot.feeGrowthGlobal1X128, snapshot.tickManager, snapshot.positionManager, snapshot.timestamp, trx))
            .then((ids) => Promise.resolve(ids[0])));
    }
    getSnapshotProfiles() {
        return this.readSnapshotProfiles().then((rows) => Promise.resolve(rows.map((row) => {
            return {
                id: row.snapshotId,
                description: row.description,
            };
        })));
    }
    getSnapshots(snapshotIds) {
        let snapshotRecords;
        return this.readSnapshots(snapshotIds)
            .then((snapshots) => {
            if (snapshots.length === 0)
                return Promise.reject(undefined);
            snapshotRecords = snapshots;
            return this.getPoolConfig(snapshots[0].poolConfigId);
        })
            .then((poolConfig) => {
            return !poolConfig
                ? Promise.reject(new Error("Pool config record is missing, please check your db file."))
                : Promise.resolve(snapshotRecords.map((snapshot) => this.deserializeSnapshot(snapshot, poolConfig)));
        })
            .catch((err) => (err ? Promise.reject(err) : Promise.resolve([])));
    }
    getSnapshot(snapshotId) {
        let snapshotRecord;
        return this.readSnapshot(snapshotId)
            .then((snapshot) => {
            if (!snapshot)
                return Promise.reject(undefined);
            snapshotRecord = snapshot;
            return this.getPoolConfig(snapshot.poolConfigId);
        })
            .then((poolConfig) => !poolConfig
            ? Promise.reject(new Error("Pool config record is missing, please check your db file."))
            : Promise.resolve(this.deserializeSnapshot(snapshotRecord, poolConfig)))
            .catch((err) => (err ? Promise.reject(err) : Promise.resolve(undefined)));
    }
    getPoolConfig(poolConfigId) {
        return this.readPoolConfig(poolConfigId).then((res) => !res
            ? Promise.resolve(undefined)
            : Promise.resolve({
                id: res.poolConfigId,
                tickSpacing: res.tickSpacing,
                token0: res.token0,
                token1: res.token1,
                fee: res.fee,
            }));
    }
    getRoadmap(roadmapId) {
        return this.readRoadmap(roadmapId).then((res) => !res
            ? Promise.resolve(undefined)
            : Promise.resolve({
                id: res.roadmapId,
                description: res.description,
                snapshots: Serializer_1.NumberArrayDeserializer(res.snapshots),
                timestamp: DateConverter_1.DateConverter.parseDate(res.timestamp),
            }));
    }
    close() {
        return this.knex.destroy();
    }
    readSnapshot(snapshotId, trx) {
        return this.getBuilderContext("snapshot", trx)
            .where("snapshotId", snapshotId)
            .first();
    }
    readSnapshots(snapshotIds, trx) {
        return this.getBuilderContext("snapshot", trx).whereIn("id", snapshotIds);
    }
    readSnapshotProfiles(trx) {
        return this.getBuilderContext("snapshot", trx)
            .select("snapshotId")
            .select("description");
    }
    insertSnapshot(snapshotId, poolConfigId, description, token0Balance, token1Balance, sqrtPriceX96, liquidity, tickCurrent, feeGrowthGlobal0X128, feeGrowthGlobal1X128, tickManager, positionManager, timestamp, trx) {
        return this.getBuilderContext("snapshot", trx).insert([
            {
                snapshotId,
                poolConfigId,
                description,
                token0Balance: Serializer_1.JSBISerializer(token0Balance),
                token1Balance: Serializer_1.JSBISerializer(token1Balance),
                sqrtPriceX96: Serializer_1.JSBISerializer(sqrtPriceX96),
                liquidity: Serializer_1.JSBISerializer(liquidity),
                tickCurrent,
                feeGrowthGlobal0X128: Serializer_1.JSBISerializer(feeGrowthGlobal0X128),
                feeGrowthGlobal1X128: Serializer_1.JSBISerializer(feeGrowthGlobal1X128),
                tickManager: Serializer_1.Serializer.serialize(TickManager_1.TickManager, tickManager),
                positionManager: Serializer_1.Serializer.serialize(PositionManager_1.PositionManager, positionManager),
                timestamp: DateConverter_1.DateConverter.formatDate(timestamp, DATE_FORMAT),
            },
        ]);
    }
    insertRoadmap(roadmapId, description, snapshots, timestamp, trx) {
        return this.getBuilderContext("roadmap", trx).insert([
            {
                roadmapId,
                description,
                snapshots: Serializer_1.NumberArraySerializer(snapshots),
                timestamp: DateConverter_1.DateConverter.formatDate(timestamp, DATE_FORMAT),
            },
        ]);
    }
    readRoadmap(roadmapId, trx) {
        return this.getBuilderContext("roadmap", trx)
            .where("roadmapId", roadmapId)
            .first();
    }
    readPoolConfig(poolConfigId, trx) {
        return this.getBuilderContext("poolConfig", trx)
            .where("poolConfigId", poolConfigId)
            .first();
    }
    insertPoolConfig(poolConfig, trx) {
        return this.getBuilderContext("poolConfig", trx).insert([
            {
                poolConfigId: poolConfig.id,
                token0: poolConfig.token0,
                token1: poolConfig.token1,
                fee: poolConfig.fee,
                tickSpacing: poolConfig.tickSpacing,
                timestamp: DateConverter_1.DateConverter.formatDate(new Date(), DATE_FORMAT),
            },
        ]);
    }
    deserializeSnapshot(snapshot, poolConfig) {
        return {
            id: snapshot.snapshotId,
            description: snapshot.description,
            poolConfig,
            token0Balance: Serializer_1.JSBIDeserializer(snapshot.token0Balance),
            token1Balance: Serializer_1.JSBIDeserializer(snapshot.token1Balance),
            sqrtPriceX96: Serializer_1.JSBIDeserializer(snapshot.sqrtPriceX96),
            liquidity: Serializer_1.JSBIDeserializer(snapshot.liquidity),
            tickCurrent: snapshot.tickCurrent,
            feeGrowthGlobal0X128: Serializer_1.JSBIDeserializer(snapshot.feeGrowthGlobal0X128),
            feeGrowthGlobal1X128: Serializer_1.JSBIDeserializer(snapshot.feeGrowthGlobal1X128),
            tickManager: Serializer_1.Serializer.deserialize(TickManager_1.TickManager, snapshot.tickManager),
            positionManager: Serializer_1.Serializer.deserialize(PositionManager_1.PositionManager, snapshot.positionManager),
            timestamp: DateConverter_1.DateConverter.parseDate(snapshot.timestamp),
        };
    }
    getBuilderContext(tableName, trx) {
        return trx ? trx(tableName) : this.knex(tableName);
    }
}
exports.SQLiteSimulationDataManager = SQLiteSimulationDataManager;
