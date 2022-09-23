import JSBI from "jsbi";
import { Tick } from "../model/Tick";
import { TickView } from "../interface/TickView";
export declare class TickManager {
    private _sortedTicks;
    get sortedTicks(): Map<number, Tick>;
    constructor(ticks?: Map<number, Tick>);
    getTickAndInitIfAbsent(tickIndex: number): Tick;
    getTickReadonly(tickIndex: number): TickView;
    set(tick: Tick): void;
    private nextInitializedTick;
    getNextInitializedTick(tick: number, tickSpacing: number, lte: boolean): {
        nextTick: number;
        initialized: boolean;
    };
    getFeeGrowthInside(tickLower: number, tickUpper: number, tickCurrent: number, feeGrowthGlobal0X128: JSBI, feeGrowthGlobal1X128: JSBI): {
        feeGrowthInside0X128: JSBI;
        feeGrowthInside1X128: JSBI;
    };
    clear(tick: number): void;
    private sortTicks;
    private getSortedTicks;
    private isBelowSmallest;
    private isAtOrAboveLargest;
    private binarySearch;
}
