import mongoose from "mongoose";
import config from "config";


async function connect() {
  const db_uri = config.get<string>("DB_URI");

  try {
    await mongoose.connect(db_uri);
    console.log("Database Connected")
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export default connect;
