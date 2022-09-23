"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickManager = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const assert_1 = __importDefault(require("assert"));
const Tick_1 = require("../model/Tick");
const typedjson_1 = require("typedjson");
const FullMath_1 = require("../util/FullMath");
let TickManager = class TickManager {
    constructor(ticks = new Map()) {
        this._sortedTicks = ticks;
        this.sortTicks();
    }
    get sortedTicks() {
        return this._sortedTicks;
    }
    getTickAndInitIfAbsent(tickIndex) {
        if (this.sortedTicks.has(tickIndex))
            return this.sortedTicks.get(tickIndex);
        const newTick = new Tick_1.Tick(tickIndex);
        this.set(newTick);
        this.sortTicks();
        return newTick;
    }
    getTickReadonly(tickIndex) {
        if (this.sortedTicks.has(tickIndex))
            return this.sortedTicks.get(tickIndex);
        return new Tick_1.Tick(tickIndex);
    }
    set(tick) {
        this.sortedTicks.set(tick.tickIndex, tick);
        this.sortTicks();
    }
    nextInitializedTick(sortedTicks, tick, lte) {
        if (lte) {
            assert_1.default(!this.isBelowSmallest(sortedTicks, tick), "BELOW_SMALLEST");
            if (this.isAtOrAboveLargest(sortedTicks, tick)) {
                return sortedTicks[sortedTicks.length - 1];
            }
            const index = this.binarySearch(sortedTicks, tick);
            return sortedTicks[index];
        }
        else {
            assert_1.default(!this.isAtOrAboveLargest(sortedTicks, tick), "AT_OR_ABOVE_LARGEST");
            if (this.isBelowSmallest(sortedTicks, tick)) {
                return sortedTicks[0];
            }
            const index = this.binarySearch(sortedTicks, tick);
            return sortedTicks[index + 1];
        }
    }
    getNextInitializedTick(tick, tickSpacing, lte) {
        const sortedTicks = this.getSortedTicks();
        let compressed = Math.floor(tick / tickSpacing); // matches rounding in the code
        // if (tick < 0 && tick % tickSpacing != 0) compressed--;
        if (lte) {
            const wordPos = compressed >> 8;
            const minimum = (wordPos << 8) * tickSpacing;
            if (this.isBelowSmallest(sortedTicks, tick)) {
                return { nextTick: minimum, initialized: false };
            }
            const index = this.nextInitializedTick(sortedTicks, tick, lte).tickIndex;
            const nextInitializedTick = Math.max(minimum, index);
            return {
                nextTick: nextInitializedTick,
                initialized: nextInitializedTick === index,
            };
        }
        else {
            const wordPos = (compressed + 1) >> 8;
            // const maximum = ((wordPos + 1) << 8) * tickSpacing - 1;
            const maximum = (((wordPos + 1) << 8) - 1) * tickSpacing;
            if (this.isAtOrAboveLargest(sortedTicks, tick)) {
                return { nextTick: maximum, initialized: false };
            }
            const index = this.nextInitializedTick(sortedTicks, tick, lte).tickIndex;
            const nextInitializedTick = Math.min(maximum, index);
            return {
                nextTick: nextInitializedTick,
                initialized: nextInitializedTick === index,
            };
        }
    }
    getFeeGrowthInside(tickLower, tickUpper, tickCurrent, feeGrowthGlobal0X128, feeGrowthGlobal1X128) {
        assert_1.default(this.sortedTicks.has(tickLower) && this.sortedTicks.has(tickUpper), "INVALID_TICK");
        const lower = this.getTickAndInitIfAbsent(tickLower);
        const upper = this.getTickAndInitIfAbsent(tickUpper);
        let feeGrowthBelow0X128;
        let feeGrowthBelow1X128;
        if (tickCurrent >= tickLower) {
            feeGrowthBelow0X128 = lower.feeGrowthOutside0X128;
            feeGrowthBelow1X128 = lower.feeGrowthOutside1X128;
        }
        else {
            feeGrowthBelow0X128 = jsbi_1.default.subtract(feeGrowthGlobal0X128, lower.feeGrowthOutside0X128);
            feeGrowthBelow1X128 = jsbi_1.default.subtract(feeGrowthGlobal1X128, lower.feeGrowthOutside1X128);
        }
        let feeGrowthAbove0X128;
        let feeGrowthAbove1X128;
        if (tickCurrent < tickUpper) {
            feeGrowthAbove0X128 = upper.feeGrowthOutside0X128;
            feeGrowthAbove1X128 = upper.feeGrowthOutside1X128;
        }
        else {
            feeGrowthAbove0X128 = jsbi_1.default.subtract(feeGrowthGlobal0X128, upper.feeGrowthOutside0X128);
            feeGrowthAbove1X128 = jsbi_1.default.subtract(feeGrowthGlobal1X128, upper.feeGrowthOutside1X128);
        }
        return {
            feeGrowthInside0X128: jsbi_1.default.subtract(FullMath_1.FullMath.mod256Sub(feeGrowthGlobal0X128, feeGrowthBelow0X128), feeGrowthAbove0X128),
            feeGrowthInside1X128: jsbi_1.default.subtract(FullMath_1.FullMath.mod256Sub(feeGrowthGlobal1X128, feeGrowthBelow1X128), feeGrowthAbove1X128),
        };
    }
    clear(tick) {
        this.sortedTicks.delete(tick);
        this.sortTicks();
    }
    sortTicks() {
        const sortedTicks = new Map([...this.sortedTicks.entries()].sort((a, b) => a[0] - b[0]));
        this._sortedTicks = sortedTicks;
    }
    getSortedTicks() {
        return Array.from(this.sortedTicks.values());
    }
    isBelowSmallest(sortedTicks, tick) {
        assert_1.default(sortedTicks.length > 0, "LENGTH");
        return tick < sortedTicks[0].tickIndex;
    }
    isAtOrAboveLargest(sortedTicks, tick) {
        assert_1.default(sortedTicks.length > 0, "LENGTH");
        return tick >= sortedTicks[sortedTicks.length - 1].tickIndex;
    }
    binarySearch(sortedTicks, tick) {
        assert_1.default(!this.isBelowSmallest(sortedTicks, tick), "BELOW_SMALLEST");
        let l = 0;
        let r = sortedTicks.length - 1;
        let i;
        while (true) {
            i = Math.floor((l + r) / 2);
            if (sortedTicks[i].tickIndex <= tick &&
                (i === sortedTicks.length - 1 || sortedTicks[i + 1].tickIndex > tick)) {
                return i;
            }
            if (sortedTicks[i].tickIndex < tick) {
                l = i + 1;
            }
            else {
                r = i - 1;
            }
        }
    }
};
__decorate([
    typedjson_1.jsonMapMember(Number, Tick_1.Tick, { name: "ticks_json" })
], TickManager.prototype, "_sortedTicks", void 0);
TickManager = __decorate([
    typedjson_1.jsonObject
], TickManager);
exports.TickManager = TickManager;
