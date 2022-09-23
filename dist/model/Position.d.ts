import JSBI from "jsbi";
export declare class Position {
    private _liquidity;
    private _feeGrowthInside0LastX128;
    private _feeGrowthInside1LastX128;
    private _tokensOwed0;
    private _tokensOwed1;
    get liquidity(): JSBI;
    get feeGrowthInside0LastX128(): JSBI;
    get feeGrowthInside1LastX128(): JSBI;
    get tokensOwed0(): JSBI;
    get tokensOwed1(): JSBI;
    update(liquidityDelta: JSBI, feeGrowthInside0X128: JSBI, feeGrowthInside1X128: JSBI): void;
    updateBurn(newTokensOwed0: JSBI, newTokensOwed1: JSBI): void;
    isEmpty(): boolean;
}
