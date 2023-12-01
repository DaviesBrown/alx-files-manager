import redisClient from "../utils/redis";
import dbClient from "../utils/db";

export default class AppController {
  static getStatus(req, res) {
    const ralive = redisClient.isAlive();
    const dbalive = dbClient.isAlive();
    res.status(200);
    res.send({"redis": ralive, "db": dbalive});
}

  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.status(200);
    res.send({"users": users, "files": files});
  }
}