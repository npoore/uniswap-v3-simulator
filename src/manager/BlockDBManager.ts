import { Block } from "@ethersproject/abstract-provider";
import { Knex, knex as knexBuilder } from "knex";
import { providers } from "ethers";
import { toBN } from "../util/BNUtils";

interface BlockRecord {
    id: number;
    number: number;
    timestamp: string;
    gasLimit: string;
    gasUsed: string;
    miner: string;
    extraData: string;
    baseFeePerGas: string;
}


export class BlockDBManager {
    private knex: Knex;
    private RPCProvider: providers.JsonRpcProvider;

    private constructor(dbPath: string) {
        const config: Knex.Config = {
            client: "sqlite3",
            connection: {
              filename: dbPath,
            },
            useNullAsDefault: true,
          };
          this.knex = knexBuilder(config);
          this.RPCProvider = new providers.JsonRpcProvider('http://ec2-54-167-207-123.compute-1.amazonaws.com:8545/');
    }

    static async buildInstance(
        dbPath: string = ":memory:"
      ): Promise<BlockDBManager> {
        let dbManager = new BlockDBManager(dbPath);
        await dbManager.initTables();
        return dbManager;
    }

    initTables(): Promise<void> {
        const knex = this.knex;

        let tasks = [
            knex.schema.hasTable("blocks").then((exists: boolean) =>
              !exists
                ? knex.schema.createTable(
                    "blocks",
                    function(t: Knex.TableBuilder) {
                        t.increments("id").primary();
                        t.integer("number");
                        t.date("timestamp");
                        t.string("gasLimit", 255);
                        t.string("gasUsed", 255);
                        t.string("miner", 255);
                        t.string("extraData", 255);
                        t.string("baseFeePerGas", 255);
                        t.index(["number"]);
                        t.index(["timestamp"]);
                        t.unique(["number"]);
                    }
                )
                : Promise.resolve()
            )
        ];
        return Promise.all(tasks).then(() => Promise.resolve());
    }

    getBlockByNumber(
        block: number
    ): Promise<Block> {
        return this.getBlockFromDB(block).then((row) =>
            !row 
            ? Promise.resolve(this.deserialzeBlock(row))
            : this.getBlockFromRPC(block)
        );
    }

    private insertBlock(
        number: number,
        timestamp: Date,
        gasLimit: string,
        gasUsed: string,
        miner: string,
        extraData: string,
        baseFeePerGas: string
    ): Promise<number> {
        return this.knex.transaction((trx) =>
            this.getBuilderContext("blocks",trx).insert([
                {
                    number,
                    timestamp,
                    gasLimit,
                    gasUsed,
                    miner,
                    extraData,
                    baseFeePerGas
                }
            ]).onConflict().ignore()
        )
        .then((ids) => Promise.resolve(ids[0]));
    }

    private deserialzeBlock(
        block: BlockRecord
    ): Block {
        return {
            transactions: [],
            hash: '',
            parentHash: '',
            number: block.number,
            timestamp: parseInt(block.timestamp),
            nonce: '',
            difficulty: 0,
            gasLimit: toBN(block.gasLimit),
            gasUsed: toBN(block.gasUsed),
            miner: block.miner,
            extraData: block.extraData,
            baseFeePerGas: (block.baseFeePerGas === '') ? undefined : toBN(block.baseFeePerGas)
        }
    }
    

    private getBlockFromDB(
        block: number
    ): Promise<Block> {
        return this.knex.transaction((trx) => 
            this.getBuilderContext("blocks", trx)
                .where("number", block)
        );
    }

    private getBlockFromRPC(
        block: number
    ): Promise<Block> {
         return this.RPCProvider.getBlock(block).then((rpcBlock) =>
            this.insertBlock(
                rpcBlock.number,
                new Date(rpcBlock.timestamp * 1000),
                rpcBlock.gasLimit.toString(),
                rpcBlock.gasUsed.toString(),
                rpcBlock.miner,
                rpcBlock.extraData,
                (rpcBlock.baseFeePerGas == null || rpcBlock.baseFeePerGas == undefined) ? '' : rpcBlock.baseFeePerGas.toString()
            ).then((id) =>
                Promise.resolve(rpcBlock)
            )
         );
         
        //  !rpcBlock
        //     ? Promise.resolve(EMPTY_BLOCK)
        //     : Promise.resolve(rpcBlock)
        //  );
    }

    private getBuilderContext(
        tableName: string,
        trx?: Knex.Transaction
      ): Knex.QueryBuilder {
        return trx ? trx(tableName) : this.knex(tableName);
      }

}


