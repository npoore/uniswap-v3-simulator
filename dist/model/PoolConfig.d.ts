import { FeeAmount } from "../enum/FeeAmount";
export declare class PoolConfig {
    readonly id: string;
    readonly tickSpacing: number;
    readonly token0: string;
    readonly token1: string;
    readonly fee: FeeAmount;
    constructor(tickSpacing: number, token0: string, token1: string, fee: FeeAmount);
}
export declare function toString(poolConfig: PoolConfig): string;
