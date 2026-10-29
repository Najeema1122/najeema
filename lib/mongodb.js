
import dns from "node:dns";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dbName = process.env.MONGODB_DB || "najeema_portfolio";

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI. Add it to .env.local.");

  let clientPromise = globalThis.__portfolioMongoClientPromise;
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
    globalThis.__portfolioMongoClientPromise = clientPromise;
  }

  const client = await clientPromise;
  return client.db(dbName);
}
