import MongoClient from 'mongodb/lib/mongo_client';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}/${database}`;

class DBClient {
  constructor() {
    this.dbclient = new MongoClient(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    this.dbclient.connect();
  }

  isAlive() {
    return this.dbclient.isConnected();
  }

  async nbUsers() {
    try {
      return await this.dbclient.db().collection('users').countDocuments();
    } catch (err) {
      throw new Error(err);
    }
  }

  async nbFiles() {
    try {
      return await this.dbclient.db().collection('files').countDocuments();
    } catch (err) {
      throw new Error(err);
    }
  }
}

export const dbClient = new DBClient();
export default dbClient;
