export declare class Roadmap {
    readonly id: string;
    readonly description: string;
    readonly snapshots: number[];
    readonly timestamp: Date;
    constructor(description: string, snapshots: number[]);
}
export declare function toString(roadmap: Roadmap): string;
