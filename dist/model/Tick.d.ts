import JSBI from "jsbi";
export declare class Tick {
    protected _tickIndex: number;
    protected _liquidityGross: JSBI;
    protected _liquidityNet: JSBI;
    protected _feeGrowthOutside0X128: JSBI;
    protected _feeGrowthOutside1X128: JSBI;
    constructor(tickIndex: number);
    get tickIndex(): number;
    get liquidityGross(): JSBI;
    get liquidityNet(): JSBI;
    get feeGrowthOutside0X128(): JSBI;
    get feeGrowthOutside1X128(): JSBI;
    get initialized(): boolean;
    update(liquidityDelta: JSBI, tickCurrent: number, feeGrowthGlobal0X128: JSBI, feeGrowthGlobal1X128: JSBI, upper: boolean, maxLiquidity: JSBI): boolean;
    cross(feeGrowthGlobal0X128: JSBI, feeGrowthGlobal1X128: JSBI): JSBI;
}
