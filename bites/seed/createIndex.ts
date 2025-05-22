import { SchemaFieldTypes } from "redis";
import { intialiseRedisClient } from "../utils/clients.js";
import { indexKey, getKeyName } from "../utils/key.js";

async function createIndex() {
    const client = await intialiseRedisClient();

    try {
        await client.ft.dropIndex(indexKey)
    }catch(err) {
        console.log("No existing index to delete")
    }

    await client.ft.create(indexKey, {
        id:{
            type:SchemaFieldTypes.TEXT,
            AS:"id"
        }
    })
}