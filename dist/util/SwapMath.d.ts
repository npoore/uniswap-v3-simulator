import JSBI from "jsbi";
import { FeeAmount } from "../enum/FeeAmount";
export declare abstract class SwapMath {
    static computeSwapStep(sqrtRatioCurrentX96: JSBI, sqrtRatioTargetX96: JSBI, liquidity: JSBI, amountRemaining: JSBI, feePips: FeeAmount): [JSBI, JSBI, JSBI, JSBI];
}
