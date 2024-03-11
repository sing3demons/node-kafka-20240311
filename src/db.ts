import { MongoClient } from "mongodb";
const uri =
  "mongodb://mongo1:30001,mongo2:30002,mongo3:30003/dev_category?replicaSet=my-replica-set";

const client = new MongoClient(uri);

export async function connectMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
}

