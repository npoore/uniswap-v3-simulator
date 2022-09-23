export interface TunerConfig {
    RPCProviderUrl: string;
}
export declare function loadConfig(file?: string): TunerConfig;
export declare function mergeDeep(target: any, source: any): any;
