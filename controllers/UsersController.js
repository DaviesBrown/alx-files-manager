import sha1 from "sha1";
import dbClient from "../utils/db";

export default class UsersController {
  static async postNew(req, res) {
    const email = req.body && req.body.email;
    const password = req.body && req.body.password;
    if (!email) {
      res.status(400).send({"error": "Missing email"});
    }
    if (!password) {
        res.status(400).send({"error": "Missing password"});
    }
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.find({email}).toArray();
    console.log(user)
    if (user.length > 0) {
        res.status(400).send({"error": "Already exist"});
    } else {
      const hpassword = sha1(password);
      const newUser = {
        email,
        password: hpassword
      }
      const { insertedId } = await userCollection.insertOne(newUser);
      res.status(201).send(JSON.stringify({id: insertedId, email}));
    }
  }
}
