import JSBI from "jsbi";
export declare type StepComputations = {
    sqrtPriceStartX96: JSBI;
    tickNext: number;
    initialized: boolean;
    sqrtPriceNextX96: JSBI;
    amountIn: JSBI;
    amountOut: JSBI;
    feeAmount: JSBI;
};
