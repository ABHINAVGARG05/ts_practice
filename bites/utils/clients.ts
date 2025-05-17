import {createClient, type RedisClientType} from "redis"

let client: RedisClientType | null = null 

export async function intialiseRedisClient() {
    if (!client) {
        client = createClient();
        client.on("error", (error)=> {
            console.error(error);
        })
        client.on("connect",()=>{
            console.log("redis connected")
        })
        await client.connect()
    }
    return client;
}