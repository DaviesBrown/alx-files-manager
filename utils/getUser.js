import { ObjectID } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

export default async function getUser(x_token) {
  const user_id = await redisClient.get(`auth_${x_token}`);
  const userCollection = dbClient.dbclient.db().collection('users');
  const user = await userCollection.findOne({ _id: new ObjectID(user_id) });
  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  return user;
}
