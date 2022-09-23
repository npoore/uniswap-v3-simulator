"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDBManager = void 0;
const knex_1 = require("knex");
const Serializer_1 = require("../util/Serializer");
const DateConverter_1 = require("../util/DateConverter");
const EventType_1 = require("../enum/EventType");
const InternalConstants_1 = require("../enum/InternalConstants");
const jsbi_1 = __importDefault(require("jsbi"));
const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";
class EventDBManager {
    constructor(dbPath) {
        const config = {
            client: "sqlite3",
            connection: {
                filename: dbPath,
            },
            useNullAsDefault: true,
        };
        this.knex = knex_1.knex(config);
    }
    static async buildInstance(dbPath = ":memory:") {
        let dbManager = new EventDBManager(dbPath);
        await dbManager.initTables();
        return dbManager;
    }
    initTables() {
        const knex = this.knex;
        let tasks = [
            knex.schema.hasTable("pool_config").then((exists) => !exists
                ? knex.schema.createTable("pool_config", function (t) {
                    t.increments("id").primary();
                    t.string("pool_config_id", 32);
                    t.string("token0", 255);
                    t.string("token1", 255);
                    t.integer("fee");
                    t.integer("tick_spacing");
                    t.string("initial_sqrt_price_X96", 255);
                    t.integer("initialization_event_block_number");
                    t.integer("latest_event_block_number");
                    t.text("timestamp");
                })
                : Promise.resolve()),
            knex.schema.hasTable("liquidity_events").then((exists) => !exists
                ? knex.schema.createTable("liquidity_events", function (t) {
                    t.increments("id").primary();
                    t.integer("type");
                    t.string("msg_sender", 255);
                    t.string("recipient", 255);
                    t.string("liquidity", 255);
                    t.string("amount0", 255);
                    t.string("amount1", 255);
                    t.integer("tick_lower");
                    t.integer("tick_upper");
                    t.integer("block_number");
                    t.integer("transaction_index");
                    t.integer("log_index");
                    t.text("date");
                    t.index(["type", "block_number"]);
                    t.index(["type", "date"]);
                })
                : Promise.resolve()),
            knex.schema.hasTable("swap_events").then((exists) => !exists
                ? knex.schema.createTable("swap_events", function (t) {
                    t.increments("id").primary();
                    t.string("msg_sender", 255);
                    t.string("recipient", 255);
                    t.string("amount0", 255);
                    t.string("amount1", 255);
                    t.string("amount_specified", 255);
                    t.string("sqrt_price_x96", 255);
                    t.string("liquidity", 255);
                    t.integer("tick");
                    t.integer("block_number");
                    t.integer("transaction_index");
                    t.integer("log_index");
                    t.text("date");
                    t.index(["block_number"]);
                    t.index(["date"]);
                })
                : Promise.resolve()),
        ];
        return Promise.all(tasks).then(() => Promise.resolve());
    }
    getPoolConfig() {
        return this.readPoolConfig().then((res) => !res
            ? Promise.resolve(undefined)
            : Promise.resolve({
                id: res.pool_config_id,
                tickSpacing: res.tick_spacing,
                token0: res.token0,
                token1: res.token1,
                fee: res.fee,
            }));
    }
    getInitializationEventBlockNumber() {
        return this.readPoolConfig().then((res) => !res
            ? Promise.resolve(0)
            : Promise.resolve(null == res.initialization_event_block_number
                ? 0
                : res.initialization_event_block_number));
    }
    getLatestEventBlockNumber() {
        return this.readPoolConfig().then((res) => !res ? Promise.resolve(0) : Promise.resolve(res.latest_event_block_number));
    }
    getInitialSqrtPriceX96() {
        return this.readPoolConfig().then((res) => !res
            ? Promise.resolve(InternalConstants_1.ZERO)
            : Promise.resolve(null == res.initial_sqrt_price_X96
                ? InternalConstants_1.ZERO
                : jsbi_1.default.BigInt(res.initial_sqrt_price_X96)));
    }
    getFirstLiquidityEvent() {
        return this.knex.transaction((trx) => this.getBuilderContext("liquidity_events", trx)
            .orderBy('date', "asc")
            .first().then((record) => Promise.resolve(this.deserializeLiquidityEvent(record))));
    }
    getLiquidityEventsByDate(type, startDate, endDate) {
        return this.queryLiquidityEventsByDate(type, startDate, endDate).then((rows) => Promise.resolve(rows.map((row) => this.deserializeLiquidityEvent(row))));
    }
    getSwapEventsByDate(startDate, endDate) {
        return this.querySwapEventsByDate(startDate, endDate).then((rows) => Promise.resolve(rows.map((row) => this.deserializeSwapEvent(row))));
    }
    getLiquidityEventsByBlockNumber(type, fromBlock, toBlock) {
        return this.queryLiquidityEventsByBlockNumber(type, fromBlock, toBlock).then((rows) => Promise.resolve(rows.map((row) => this.deserializeLiquidityEvent(row))));
    }
    deleteLiquidityEventsByBlockNumber(type, fromBlock, toBlock) {
        return this.knex.transaction((trx) => this.getBuilderContext("liquidity_events", trx)
            .where("type", type)
            .andWhere("block_number", ">=", fromBlock)
            .andWhere("block_number", "<=", toBlock)
            .del());
    }
    getSwapEventsByBlockNumber(fromBlock, toBlock) {
        return this.querySwapEventsByBlockNumber(fromBlock, toBlock).then((rows) => Promise.resolve(rows.map((row) => this.deserializeSwapEvent(row))));
    }
    deleteSwapEventsByBlockNumber(fromBlock, toBlock) {
        return this.knex.transaction((trx) => this.getBuilderContext("swap_events", trx)
            .andWhere("block_number", ">=", fromBlock)
            .andWhere("block_number", "<=", toBlock)
            .del());
    }
    addPoolConfig(poolConfig) {
        return this.knex.transaction((trx) => this.insertPoolConfig(poolConfig, trx).then((ids) => Promise.resolve(ids[0])));
    }
    addAmountSpecified(id, amountSpecified) {
        return this.knex.transaction((trx) => this.updateAmountSpecified(id, amountSpecified, trx).then((ids) => Promise.resolve(ids[0])));
    }
    addInitialSqrtPriceX96(initialSqrtPriceX96) {
        return this.knex.transaction((trx) => this.updateInitialSqrtPriceX96(initialSqrtPriceX96, trx).then((ids) => Promise.resolve(ids[0])));
    }
    saveLatestEventBlockNumber(latestEventBlockNumber) {
        return this.knex.transaction((trx) => this.updateLatestEventBlockNumber(latestEventBlockNumber, trx).then((id) => Promise.resolve(id)));
    }
    saveInitializationEventBlockNumber(initializationEventBlockNumber) {
        return this.knex.transaction((trx) => this.updateInitializationEventBlockNumber(initializationEventBlockNumber, trx).then((id) => Promise.resolve(id)));
    }
    insertLiquidityEvent(type, msg_sender, recipient, liquidity, amount0, amount1, tick_lower, tick_upper, block_number, transaction_index, log_index, date) {
        return this.knex
            .transaction((trx) => this.getBuilderContext("liquidity_events", trx).insert([
            {
                type,
                msg_sender,
                recipient,
                liquidity,
                amount0,
                amount1,
                tick_lower,
                tick_upper,
                block_number,
                transaction_index,
                log_index,
                date: DateConverter_1.DateConverter.formatDate(date, DATE_FORMAT),
            },
        ]))
            .then((ids) => Promise.resolve(ids[0]));
    }
    insertSwapEvent(msg_sender, recipient, amount0, amount1, sqrt_price_x96, liquidity, tick, block_number, transaction_index, log_index, date) {
        return this.knex.transaction((trx) => this.getBuilderContext("swap_events", trx).insert([
            {
                msg_sender,
                recipient,
                amount0,
                amount1,
                amount_specified: undefined,
                sqrt_price_x96,
                liquidity,
                tick,
                block_number,
                transaction_index,
                log_index,
                date: DateConverter_1.DateConverter.formatDate(date, DATE_FORMAT),
            },
        ]));
    }
    close() {
        return this.knex.destroy();
    }
    readPoolConfig(trx) {
        return this.getBuilderContext("pool_config", trx).first();
    }
    queryLiquidityEventsByDate(type, startDate, endDate, trx) {
        return this.getBuilderContext("liquidity_events", trx)
            .where("type", type)
            .andWhere("date", ">=", startDate)
            .andWhere("date", "<", endDate);
    }
    querySwapEventsByDate(startDate, endDate, trx) {
        return this.getBuilderContext("swap_events", trx)
            .andWhere("date", ">=", startDate)
            .andWhere("date", "<", endDate);
    }
    queryLiquidityEventsByBlockNumber(type, fromBlock, toBlock, trx) {
        return this.getBuilderContext("liquidity_events", trx)
            .where("type", type)
            .andWhere("block_number", ">=", fromBlock)
            .andWhere("block_number", "<=", toBlock);
    }
    querySwapEventsByBlockNumber(fromBlock, toBlock, trx) {
        return this.getBuilderContext("swap_events", trx)
            .andWhere("block_number", ">=", fromBlock)
            .andWhere("block_number", "<=", toBlock);
    }
    insertPoolConfig(poolConfig, trx) {
        return this.getBuilderContext("pool_config", trx).insert([
            {
                pool_config_id: poolConfig.id,
                token0: poolConfig.token0,
                token1: poolConfig.token1,
                fee: poolConfig.fee,
                tick_spacing: poolConfig.tickSpacing,
                initial_sqrt_price_X96: undefined,
                latest_event_block_number: 0,
                timestamp: DateConverter_1.DateConverter.formatDate(new Date(), DATE_FORMAT),
            },
        ]);
    }
    updateAmountSpecified(id, amountSpecified, trx) {
        return this.getBuilderContext("swap_events", trx)
            .update("amount_specified", amountSpecified)
            .where("id", id);
    }
    updateInitialSqrtPriceX96(initialSqrtPriceX96, trx) {
        return this.getBuilderContext("pool_config", trx)
            .update("initial_sqrt_price_X96", initialSqrtPriceX96)
            .where("id", 1);
    }
    updateLatestEventBlockNumber(latestEventBlockNumber, trx) {
        return this.getBuilderContext("pool_config", trx)
            .update("latest_event_block_number", latestEventBlockNumber)
            .where("id", 1);
    }
    updateInitializationEventBlockNumber(initializationEventBlockNumber, trx) {
        return this.getBuilderContext("pool_config", trx)
            .update("initialization_event_block_number", initializationEventBlockNumber)
            .where("id", 1);
    }
    deserializeLiquidityEvent(event) {
        return {
            id: event.id,
            type: event.type,
            msgSender: event.msg_sender,
            recipient: event.recipient,
            liquidity: Serializer_1.JSBIDeserializer(event.liquidity),
            amount0: Serializer_1.JSBIDeserializer(event.amount0),
            amount1: Serializer_1.JSBIDeserializer(event.amount1),
            tickLower: event.tick_lower,
            tickUpper: event.tick_upper,
            blockNumber: event.block_number,
            transactionIndex: event.transaction_index,
            logIndex: event.log_index,
            date: DateConverter_1.DateConverter.parseDate(event.date),
        };
    }
    deserializeSwapEvent(event) {
        return {
            id: event.id,
            type: EventType_1.EventType.SWAP,
            msgSender: event.msg_sender,
            recipient: event.recipient,
            amount0: Serializer_1.JSBIDeserializer(event.amount0),
            amount1: Serializer_1.JSBIDeserializer(event.amount1),
            amountSpecified: Serializer_1.JSBIDeserializer(event.amount_specified),
            sqrtPriceX96: Serializer_1.JSBIDeserializer(event.sqrt_price_x96),
            liquidity: Serializer_1.JSBIDeserializer(event.liquidity),
            tick: event.tick,
            blockNumber: event.block_number,
            transactionIndex: event.transaction_index,
            logIndex: event.log_index,
            date: DateConverter_1.DateConverter.parseDate(event.date),
        };
    }
    getBuilderContext(tableName, trx) {
        return trx ? trx(tableName) : this.knex(tableName);
    }
}
exports.EventDBManager = EventDBManager;
