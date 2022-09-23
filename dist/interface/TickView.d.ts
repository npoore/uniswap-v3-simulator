import { Tick } from "../model/Tick";
export declare type TickView = Pick<Tick, {
    [K in keyof Tick]: Tick[K] extends Function ? never : K;
}[keyof Tick]>;
