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
var Tick_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tick = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const assert_1 = __importDefault(require("assert"));
const TickMath_1 = require("../util/TickMath");
const typedjson_1 = require("typedjson");
const Serializer_1 = require("../util/Serializer");
const LiquidityMath_1 = require("../util/LiquidityMath");
const InternalConstants_1 = require("../enum/InternalConstants");
let Tick = Tick_1 = class Tick {
    constructor(tickIndex) {
        this._tickIndex = 0;
        this._liquidityGross = InternalConstants_1.ZERO;
        this._liquidityNet = InternalConstants_1.ZERO;
        this._feeGrowthOutside0X128 = InternalConstants_1.ZERO;
        this._feeGrowthOutside1X128 = InternalConstants_1.ZERO;
        assert_1.default(tickIndex >= TickMath_1.TickMath.MIN_TICK && tickIndex <= TickMath_1.TickMath.MAX_TICK, "TICK");
        this._tickIndex = tickIndex;
    }
    get tickIndex() {
        return this._tickIndex;
    }
    get liquidityGross() {
        return this._liquidityGross;
    }
    get liquidityNet() {
        return this._liquidityNet;
    }
    get feeGrowthOutside0X128() {
        return this._feeGrowthOutside0X128;
    }
    get feeGrowthOutside1X128() {
        return this._feeGrowthOutside1X128;
    }
    get initialized() {
        return jsbi_1.default.notEqual(this.liquidityGross, InternalConstants_1.ZERO);
    }
    update(liquidityDelta, tickCurrent, feeGrowthGlobal0X128, feeGrowthGlobal1X128, upper, maxLiquidity) {
        const liquidityGrossBefore = this.liquidityGross;
        const liquidityGrossAfter = LiquidityMath_1.LiquidityMath.addDelta(liquidityGrossBefore, liquidityDelta);
        assert_1.default(jsbi_1.default.lessThanOrEqual(liquidityGrossAfter, maxLiquidity), "LO");
        const flipped = jsbi_1.default.equal(liquidityGrossAfter, InternalConstants_1.ZERO) !=
            jsbi_1.default.equal(liquidityGrossBefore, InternalConstants_1.ZERO);
        if (jsbi_1.default.equal(liquidityGrossBefore, InternalConstants_1.ZERO)) {
            if (this.tickIndex <= tickCurrent) {
                this._feeGrowthOutside0X128 = feeGrowthGlobal0X128;
                this._feeGrowthOutside1X128 = feeGrowthGlobal1X128;
            }
        }
        this._liquidityGross = liquidityGrossAfter;
        this._liquidityNet = upper
            ? jsbi_1.default.subtract(this._liquidityNet, liquidityDelta)
            : jsbi_1.default.add(this._liquidityNet, liquidityDelta);
        assert_1.default(jsbi_1.default.lessThanOrEqual(this.liquidityNet, InternalConstants_1.MaxInt128));
        assert_1.default(jsbi_1.default.greaterThanOrEqual(this.liquidityNet, InternalConstants_1.MinInt128));
        return flipped;
    }
    cross(feeGrowthGlobal0X128, feeGrowthGlobal1X128) {
        this._feeGrowthOutside0X128 = jsbi_1.default.subtract(feeGrowthGlobal0X128, this._feeGrowthOutside0X128);
        this._feeGrowthOutside1X128 = jsbi_1.default.subtract(feeGrowthGlobal1X128, this._feeGrowthOutside1X128);
        return this._liquidityNet;
    }
};
__decorate([
    typedjson_1.jsonMember(Number, { name: "tickIndex" })
], Tick.prototype, "_tickIndex", void 0);
__decorate([
    typedjson_1.jsonMember({
        name: "liquidityGross",
        deserializer: Serializer_1.JSBIDeserializer,
        serializer: Serializer_1.JSBISerializer,
    })
], Tick.prototype, "_liquidityGross", void 0);
__decorate([
    typedjson_1.jsonMember({
        name: "liquidityNet",
        deserializer: Serializer_1.JSBIDeserializer,
        serializer: Serializer_1.JSBISerializer,
    })
], Tick.prototype, "_liquidityNet", void 0);
__decorate([
    typedjson_1.jsonMember({
        name: "feeGrowthOutside0X128",
        deserializer: Serializer_1.JSBIDeserializer,
        serializer: Serializer_1.JSBISerializer,
    })
], Tick.prototype, "_feeGrowthOutside0X128", void 0);
__decorate([
    typedjson_1.jsonMember({
        name: "feeGrowthOutside1X128",
        deserializer: Serializer_1.JSBIDeserializer,
        serializer: Serializer_1.JSBISerializer,
    })
], Tick.prototype, "_feeGrowthOutside1X128", void 0);
Tick = Tick_1 = __decorate([
    typedjson_1.jsonObject({
        initializer: (_, rawSourceObject) => {
            return new Tick_1(rawSourceObject.tickIndex);
        },
    })
], Tick);
exports.Tick = Tick;
