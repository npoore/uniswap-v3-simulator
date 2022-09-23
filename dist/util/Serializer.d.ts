import JSBI from "jsbi";
import { Constructor } from "typedjson/src/types";
export declare abstract class Serializer {
    static serialize<T>(rootConstructor: Constructor<T>, object: T): string;
    static deserialize<T>(rootConstructor: Constructor<T>, jsonStr: string): T;
}
export declare const JSBISerializer: (jsbi: JSBI) => string;
export declare const JSBIDeserializer: (str: string) => JSBI;
export declare const NumberArraySerializer: (arr: Array<number>) => string;
export declare const NumberArrayDeserializer: (str: string) => Array<number>;
export declare function printParams(params: object): string;
