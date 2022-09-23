import JSBI from "jsbi";
export declare abstract class FullMath {
    static MAX_SAFE_INTEGER: JSBI;
    static mulDiv(a: JSBI, b: JSBI, denominator: JSBI): JSBI;
    static mulDivRoundingUp(a: JSBI, b: JSBI, denominator: JSBI): JSBI;
    static mod256Sub(a: JSBI, b: JSBI): JSBI;
    static equalsWithTolerance(a: JSBI, b: JSBI, toleranceInMinUnit: JSBI): boolean;
    /**
     * Computes floor(sqrt(value))
     * @param value the value for which to compute the square root, rounded down
     */
    static sqrt(value: JSBI): JSBI;
    static incrTowardInfinity(value: JSBI): JSBI;
}
