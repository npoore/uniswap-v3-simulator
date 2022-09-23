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
var PositionManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionManager = void 0;
const Position_1 = require("../model/Position");
const typedjson_1 = require("typedjson");
const jsbi_1 = __importDefault(require("jsbi"));
const assert_1 = __importDefault(require("assert"));
const InternalConstants_1 = require("../enum/InternalConstants");
let PositionManager = PositionManager_1 = class PositionManager {
    constructor(positions = new Map()) {
        this.positions = positions;
    }
    static getKey(owner, tickLower, tickUpper) {
        // We might need a fancier hash function here
        // but for now, I think this will do, and it's more verbose:
        return owner + "_" + tickLower.toString() + "_" + tickUpper.toString();
    }
    set(key, position) {
        this.positions.set(key, position);
    }
    clear(key) {
        if (this.positions.has(key))
            this.positions.delete(key);
    }
    getPositionAndInitIfAbsent(key) {
        if (this.positions.has(key))
            return this.positions.get(key);
        const newPosition = new Position_1.Position();
        this.set(key, newPosition);
        return newPosition;
    }
    getPositionReadonly(owner, tickLower, tickUpper) {
        const key = PositionManager_1.getKey(owner, tickLower, tickUpper);
        if (this.positions.has(key))
            return this.positions.get(key);
        return new Position_1.Position();
    }
    collectPosition(owner, tickLower, tickUpper, amount0Requested, amount1Requested) {
        assert_1.default(jsbi_1.default.greaterThanOrEqual(amount0Requested, InternalConstants_1.ZERO) &&
            jsbi_1.default.greaterThanOrEqual(amount1Requested, InternalConstants_1.ZERO), "amounts requested should be positive");
        const key = PositionManager_1.getKey(owner, tickLower, tickUpper);
        if (this.positions.has(key)) {
            const positionToCollect = this.positions.get(key);
            const amount0 = jsbi_1.default.greaterThan(amount0Requested, positionToCollect.tokensOwed0)
                ? positionToCollect.tokensOwed0
                : amount0Requested;
            const amount1 = jsbi_1.default.greaterThan(amount1Requested, positionToCollect.tokensOwed1)
                ? positionToCollect.tokensOwed1
                : amount1Requested;
            if (jsbi_1.default.greaterThan(amount0, InternalConstants_1.ZERO) || jsbi_1.default.greaterThan(amount1, InternalConstants_1.ZERO)) {
                positionToCollect.updateBurn(jsbi_1.default.subtract(positionToCollect.tokensOwed0, amount0), jsbi_1.default.subtract(positionToCollect.tokensOwed1, amount1));
                if (positionToCollect.isEmpty())
                    this.clear(key);
            }
            return { amount0: amount0, amount1: amount1 };
        }
        return { amount0: InternalConstants_1.ZERO, amount1: InternalConstants_1.ZERO };
    }
};
__decorate([
    typedjson_1.jsonMapMember(String, Position_1.Position, { name: "positions_json" })
], PositionManager.prototype, "positions", void 0);
PositionManager = PositionManager_1 = __decorate([
    typedjson_1.jsonObject
], PositionManager);
exports.PositionManager = PositionManager;
