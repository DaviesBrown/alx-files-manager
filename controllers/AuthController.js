import sha1 from "sha1";
import { v4 } from "uuid";
import  { ObjectID } from 'mongodb';

import dbClient from "../utils/db";
import redisClient from "../utils/redis";

export default class AuthController {
  static async getConnect(req, res, next) {
    try {
      const authheader = req.headers.authorization;
      const auth = new Buffer.from(authheader.split(' ')[1],
          'base64').toString().split(':');
      const email = auth[0];
      const password = sha1(auth[1]);
      const userCollection = dbClient.dbclient.db().collection('users');
      const user = await userCollection.findOne({ email, password });
      if (!user) {
        res.status(401).send({"error": "Unauthorized"});
      } else {
        const token = v4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id, `${24 * 60 * 60}`);
        res.status(200).send(JSON.stringify({token}));
      }
    } catch(err) {
        res.status(500);
        console.log(err);
    }
  }

  static async getDisconnect(req, res) {
    const x_token = req.headers['x-token'];
    const user_id = await redisClient.get(`auth_${x_token}`);
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.findOne({ "_id": new ObjectID(user_id) });
    if (!user) {
      res.status(401).send({"error": "Unauthorized"});
    } else {
      redisClient.del(`auth_${x_token}`);
      res.status(204).send();
    }
  }
}