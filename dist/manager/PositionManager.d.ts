import { Position } from "../model/Position";
import JSBI from "jsbi";
import { PositionView } from "../interface/PositionView";
export declare class PositionManager {
    private positions;
    constructor(positions?: Map<string, Position>);
    static getKey(owner: string, tickLower: number, tickUpper: number): string;
    set(key: string, position: Position): void;
    clear(key: string): void;
    getPositionAndInitIfAbsent(key: string): Position;
    getPositionReadonly(owner: string, tickLower: number, tickUpper: number): PositionView;
    collectPosition(owner: string, tickLower: number, tickUpper: number, amount0Requested: JSBI, amount1Requested: JSBI): {
        amount0: JSBI;
        amount1: JSBI;
    };
}
