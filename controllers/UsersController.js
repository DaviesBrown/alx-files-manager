import sha1 from "sha1";
import  { ObjectID } from 'mongodb';

import redisClient from "../utils/redis";
import dbClient from "../utils/db";

export default class UsersController {
  static async postNew(req, res) {
    try {
      const email = req.body && req.body.email;
      const password = req.body && req.body.password;

      if (!email) {
        return res.status(400).send({ error: "Missing email" });
      }
      if (!password) {
        return res.status(400).send({ error: "Missing password" });
      }

      const userCollection = dbClient.dbclient.db().collection('users');
      const user = await userCollection.findOne({ email });

      if (user) {
        return res.status(400).send({ error: "User already exists" });
      }

      const hashedPassword = sha1(password);
      const newUser = {
        email,
        password: hashedPassword
      };

      const { insertedId } = await userCollection.insertOne(newUser);
      return res.status(201).send(JSON.stringify({ id: insertedId, email }));
    } catch (error) {
      console.error(error);
      return res.status(500).send({ error: "Internal Server Error" });
    }
  }

  static async getMe(req, res) {
    const x_token = req.headers['x-token'];
    const user_id = await redisClient.get(`auth_${x_token}`);
    console.log(x_token, user_id)
    const userCollection = dbClient.dbclient.db().collection('users');
    console.log(await userCollection.find({}).toArray())
    const user = await userCollection.findOne({ "_id": new ObjectID(user_id) });
    if (!user) {
      res.status(401).send({"error": "Unauthorized"});
    } else {
      res.status(200).send(JSON.stringify({id: user_id, email: user.email}));
    }
  }
}
