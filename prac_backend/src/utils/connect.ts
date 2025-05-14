import mongoose from "mongoose";
import config from "config";
import logger from "./logger";


async function connect() {
  const db_uri = config.get<string>("DB_URI");

  try {
    await mongoose.connect(db_uri);
    logger.info("Database Connected")
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

export default connect;
