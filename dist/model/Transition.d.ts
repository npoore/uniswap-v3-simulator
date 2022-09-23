import { PoolState } from "./PoolState";
import { Record } from "../entity/Record";
import { Visitable } from "../interface/Visitable";
import { SimulatorVisitor } from "../interface/SimulatorVisitor";
import { Transition as TransitionView } from "../interface/Transition";
import { PoolStateView } from "../interface/PoolStateView";
export declare class Transition implements Visitable, TransitionView {
    private _source;
    private _target;
    private _record;
    get source(): PoolState;
    get target(): PoolState | undefined;
    set target(value: PoolState | undefined);
    get record(): Record;
    constructor(source: PoolState, record: Record);
    getSource(): PoolStateView;
    getTarget(): PoolStateView;
    getRecord(): Record;
    accept(visitor: SimulatorVisitor): Promise<string>;
    toString(): string;
}
