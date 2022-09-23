import JSBI from "jsbi";
import { TickManager } from "../manager/TickManager";
import { PositionManager } from "../manager/PositionManager";
import { FeeAmount } from "../enum/FeeAmount";
import { TickView } from "../interface/TickView";
import { PositionView } from "../interface/PositionView";
export declare class CorePool {
    readonly token0: string;
    readonly token1: string;
    readonly fee: FeeAmount;
    readonly tickSpacing: number;
    readonly maxLiquidityPerTick: JSBI;
    private _token0Balance;
    private _token1Balance;
    private _sqrtPriceX96;
    private _liquidity;
    private _tickCurrent;
    private _feeGrowthGlobal0X128;
    private _feeGrowthGlobal1X128;
    private _tickManager;
    private _positionManager;
    constructor(token0: string, token1: string, fee: FeeAmount, tickSpacing: number, token0Balance?: JSBI, token1Balance?: JSBI, sqrtPriceX96?: JSBI, liquidity?: JSBI, tickCurrent?: number, feeGrowthGlobal0X128?: JSBI, feeGrowthGlobal1X128?: JSBI, tickManager?: TickManager, positionManager?: PositionManager);
    get token0Balance(): JSBI;
    get token1Balance(): JSBI;
    get sqrtPriceX96(): JSBI;
    get liquidity(): JSBI;
    get tickCurrent(): number;
    get feeGrowthGlobal0X128(): JSBI;
    get feeGrowthGlobal1X128(): JSBI;
    get tickManager(): TickManager;
    get positionManager(): PositionManager;
    initialize(sqrtPriceX96: JSBI): void;
    mint(recipient: string, tickLower: number, tickUpper: number, amount: JSBI): {
        amount0: JSBI;
        amount1: JSBI;
    };
    burn(owner: string, tickLower: number, tickUpper: number, amount: JSBI): {
        amount0: JSBI;
        amount1: JSBI;
    };
    collect(recipient: string, tickLower: number, tickUpper: number, amount0Requested: JSBI, amount1Requested: JSBI): {
        amount0: JSBI;
        amount1: JSBI;
    };
    querySwap(zeroForOne: boolean, amountSpecified: JSBI, sqrtPriceLimitX96?: JSBI): {
        amount0: JSBI;
        amount1: JSBI;
        sqrtPriceX96: JSBI;
    };
    swap(zeroForOne: boolean, amountSpecified: JSBI, sqrtPriceLimitX96?: JSBI): {
        amount0: JSBI;
        amount1: JSBI;
    };
    private handleSwap;
    private checkTicks;
    private modifyPosition;
    private updatePosition;
    getTickMap(): Map<number, TickView>;
    getTick(tick: number): TickView;
    getPosition(owner: string, tickLower: number, tickUpper: number): PositionView;
    toString(): string;
}
