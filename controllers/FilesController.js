import { existsSync, mkdir, writeFile } from "fs";
import { ObjectID } from "mongodb";
import dbClient from "../utils/db";
import redisClient from "../utils/redis";
import { randomUUID } from "crypto";

export default class FilesController {  
  static async postUpload(req, res) {
    const x_token = req.headers['x-token'];
    const user_id = await redisClient.get(`auth_${x_token}`);
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.findOne({ "_id": new ObjectID(user_id) });
    if (!user) {
        return res.status(401).send({"error": "Unauthorized"});
    } else {
        const fileType = ['folder', 'file', 'image'];
        const name = req.body && req.body.name;
        const type = req.body && req.body.type;
        const parentId = req.body && req.body.parentId || 0;
      const isPublic = req.body && req.body.isPublic || false;
      const data = req.body && req.body.data;
      if (!name) {
          return res.status(400).send({"error": "Missing name"});
      }
      if (!type || !fileType.includes(type)) {
          return res.status(400).send({"error": "Missing type"});
      }
      if (!data && type !== 'folder') {
        return res.status(400).send({"error": "Missing data"});
      }
      const fileCollection = dbClient.dbclient.db().collection('files');
      if (parentId) {

        const file = await fileCollection.findOne({ "_id": new ObjectID(parentId) });
        if (!file) {
            return res.status(400).send({"error": "Parent not found"});
        } else if (file && file.type !== 'folder') {
            return res.status(400).send({"error": "Parent is not a folder"});
        }
      }
      const document = {name, type, parentId, isPublic};
      document.userId = user._id;
    if (type === 'folder') {
        const folder = await fileCollection.insertOne(document);
        return res.status(201).send(JSON.stringify(folder.ops[0]));
    } else {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!existsSync(folderPath)) {
            mkdir(folderPath);
        }
        const filePath = `${folderPath}/${randomUUID()}`;
        const content = atob(data);
        writeFile(filePath, content, (err) => {
            if (err) throw err;
            console.log('Replaced!');
        });
        document.localPath = filePath;
        const file = await fileCollection.insertOne(document);
        return res.status(201).send(JSON.stringify(file.ops[0]));
      }
    }
  }

  static async getShow(req, res) {
    // GET /files/:id
    const x_token = req.headers['x-token'];
    const parentId = req.params.id;
    const user_id = await redisClient.get(`auth_${x_token}`);
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.findOne({ "_id": new ObjectID(user_id) });
    if (!user) {
        return res.status(401).send({"error": "Unauthorized"});
    }
    const fileCollection = dbClient.dbclient.db().collection('files');
    const file = await fileCollection.findOne({
        "_id": new ObjectID(parentId),
        "userId": new ObjectID(user._id)
    });
    if (!file) {
        return res.status(404).send({"error": "Not found"});
    }
    res.status(200).send(file);
  }

  static async getIndex(req, res) {
    // GET /files
    const x_token = req.headers['x-token'];
    const parentId = req.query && req.query.parentId;
    console.log(parentId)
    const user_id = await redisClient.get(`auth_${x_token}`);
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.findOne({ "_id": new ObjectID(user_id) });
    if (!user) {
        return res.status(401).send({"error": "Unauthorized"});
    }
    const fileCollection = dbClient.dbclient.db().collection('files');
    if (parentId) {
        let files = await fileCollection.find({
            "parentId": parentId,
            "userId": new ObjectID(user_id)
        });
        files = await files.toArray();
        if (files) {
            return res.send((files));
        } else {
            return res.send([]);
        }
    }
    const file = await fileCollection.find({ "userId": new ObjectID(user_id) });
    res.send(await file.toArray());
  }
}
