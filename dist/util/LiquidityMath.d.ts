import JSBI from "jsbi";
export declare abstract class LiquidityMath {
    static addDelta(x: JSBI, y: JSBI): JSBI;
    static getAmountsForLiquidity(sqrtRatioX96: JSBI, sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, liquidity: JSBI): {
        amount0: JSBI;
        amount1: JSBI;
    };
    /**
     * Computes the maximum amount of liquidity received for a given amount of token0, token1,
     * and the prices at the tick boundaries.
     * @param sqrtRatioCurrentX96 the current price
     * @param sqrtRatioAX96 price at lower boundary
     * @param sqrtRatioBX96 price at upper boundary
     * @param amount0 token0 amount
     * @param amount1 token1 amount
     * @param useFullPrecision if false, liquidity will be maximized according to what the router can calculate,
     * not what core can theoretically support
     */
    static maxLiquidityForAmounts(sqrtRatioCurrentX96: JSBI, sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount0: JSBI, amount1: JSBI, useFullPrecision: boolean): JSBI;
    private static maxLiquidityForAmount0Imprecise;
    /**
     * Returns a precise maximum amount of liquidity received for a given amount of token 0 by dividing by Q64 instead of Q96 in the intermediate step,
     * and shifting the subtracted ratio left by 32 bits.
     * @param sqrtRatioAX96 The price at the lower boundary
     * @param sqrtRatioBX96 The price at the upper boundary
     * @param amount0 The token0 amount
     * @returns liquidity for amount0, precise
     */
    private static maxLiquidityForAmount0Precise;
    /**
     * Computes the maximum amount of liquidity received for a given amount of token1
     * @param sqrtRatioAX96 The price at the lower tick boundary
     * @param sqrtRatioBX96 The price at the upper tick boundary
     * @param amount1 The token1 amount
     * @returns liquidity for amount1
     */
    private static maxLiquidityForAmount1;
}
