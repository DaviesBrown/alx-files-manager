/* eslint-disable consistent-return */
/* eslint-disable import/no-named-as-default */
import {
  existsSync, mkdir, readFileSync, writeFile,
} from 'fs';
import { ObjectID } from 'mongodb';
import { randomUUID } from 'crypto';
import mime from 'mime-types';

import Queue from 'bull';
import getUser from '../utils/getUser';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class FilesController {
  static async postUpload(req, res) {
    // POST /files
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.findOne({ _id: new ObjectID(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const fileType = ['folder', 'file', 'image'];
    const name = req.body && req.body.name;
    const type = req.body && req.body.type;
    const parentId = (req.body && req.body.parentId) || 0;
    const isPublic = (req.body && req.body.isPublic) || false;
    const data = req.body && req.body.data;
    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    if (!type || !fileType.includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }
    const fileCollection = dbClient.dbclient.db().collection('files');
    const file = await fileCollection.findOne({ _id: new ObjectID(parentId) });
    if (parentId) {
      if (!file) {
        return res.status(400).send({ error: 'Parent not found' });
      } if (file && file.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }
    const fileId = file._id;
    const document = {
      name, type, parentId, isPublic,
    };
    document.userId = user._id;
    if (type === 'folder') {
      const folder = await fileCollection.insertOne(document);
      res.status(201).send(JSON.stringify(folder.ops[0]));
    } else {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!existsSync(folderPath)) {
        mkdir(folderPath);
      }
      if (type === 'image') {
        const fileQueue = new Queue('fileQueue');
        fileQueue.add({ userId: user._id, fileId });
      }
      const filePath = `${folderPath}/${randomUUID()}`;
      const content = atob(data);
      writeFile(filePath, content, (err) => {
        if (err) throw err;
        console.log('Replaced!');
      });
      document.localPath = filePath;
      const file = await fileCollection.insertOne(document);
      res.status(201).send(JSON.stringify(file.ops[0]));
    }
  }

  static async getShow(req, res) {
    // GET /files/:id
    const xToken = req.headers['x-token'];
    const parentId = req.params && req.params.id;
    const userId = await redisClient.get(`auth_${xToken}`);
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.findOne({ _id: new ObjectID(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const fileCollection = dbClient.dbclient.db().collection('files');
    const file = await fileCollection.findOne({
      _id: new ObjectID(parentId),
      userId: new ObjectID(user._id),
    });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    res.status(200).send(file);
  }

  static async getIndex(req, res) {
    // GET /files
    const xToken = req.headers['x-token'];
    const parentId = req.query && req.query.parentId;
    const userId = await redisClient.get(`auth_${xToken}`);
    const userCollection = dbClient.dbclient.db().collection('users');
    const user = await userCollection.findOne({ _id: new ObjectID(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const fileCollection = dbClient.dbclient.db().collection('files');
    if (parentId) {
      let files = await fileCollection.find({
        parentId,
        userId: new ObjectID(userId),
      });
      files = await files.toArray();
      if (files) {
        return res.send((files));
      }
      return res.send([]);
    }
    const file = await fileCollection.find({ userId: new ObjectID(userId) });
    res.send(await file.toArray());
  }

  static async putPublish(req, res) {
    const user = await getUser(req.headers['x-token']);
    const fileId = req.params.id;
    const fileCollection = dbClient.dbclient.db().collection('files');
    let file = await fileCollection.findOne({
      _id: new ObjectID(fileId),
      userId: new ObjectID(user._id),
    });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    const filter = {
      _id: new ObjectID(fileId),
      userId: new ObjectID(user._id),
    };
    const newvalues = { $set: { isPublic: true } };
    await fileCollection.updateOne(filter, newvalues);
    file = await fileCollection.findOne({
      _id: new ObjectID(fileId),
      userId: new ObjectID(user._id),
    });
    res.status(200).send(file);
  }

  static async putUnpublish(req, res) {
    const user = await getUser(req.headers['x-token']);
    const fileId = req.params.id;
    const fileCollection = dbClient.dbclient.db().collection('files');
    let file = await fileCollection.findOne({
      _id: new ObjectID(fileId),
      userId: new ObjectID(user._id),
    });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    const filter = {
      _id: new ObjectID(fileId),
      userId: new ObjectID(user._id),
    };
    const newvalues = { $set: { isPublic: false } };
    await fileCollection.updateOne(filter, newvalues);
    file = await fileCollection.findOne({
      _id: new ObjectID(fileId),
      userId: new ObjectID(user._id),
    });
    res.status(200).send(file);
  }

  static async getFile(req, res) {
    // GET /files/:id/data
    const user = await getUser(req.headers['x-token']);
    const fileId = req.params.id;
    const fileCollection = dbClient.dbclient.db().collection('files');
    const file = await fileCollection.findOne({
      _id: new ObjectID(fileId),
      userId: new ObjectID(user._id),
    });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (file.isPublic === false) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }
    const mimeType = mime.contentType(file.name);
    const fileContent = readFileSync(file.localPath);
    res.contentType(mimeType);
    res.send(fileContent);
  }
}
