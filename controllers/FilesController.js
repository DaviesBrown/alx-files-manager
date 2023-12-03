import ObjectID from "mongodb";
import dbClient from "../utils/db";
import redisClient from "../utils/redis";

export default class FilesController {
  static async postUpload(req, res) {
    const x_token = req.headers['x-token'];
    const user_id = await redisClient.get(`auth_${x_token}`);
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.findOne({ "_id": new ObjectID(user_id) });
    if (!user) {
      res.status(401).send({"error": "Unauthorized"});
    } else {
      const name = req.params
      console.log(name)
    }
  }
}
