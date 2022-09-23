export declare abstract class IdGenerator {
    static guid: (<T extends ArrayLike<number>>(options: import("uuid").V4Options | null | undefined, buffer: T, offset?: number | undefined) => T) & ((options?: import("uuid").V4Options | undefined) => string);
    static validate: (uuid: string) => boolean;
}
