import Queue from "bull";
import { ObjectID } from "mongodb";
import fs from "fs";
import imageThumbnail from "image-thumbnail";

import dbClient from "./utils/db";

const fileQueue =  new Queue("fileQueue");

fileQueue.process(async (job, done) => {
    if (!job.data.fileId) done(new Error("Missing fileId"));
    if (!job.data.userId) done(new Error("Missing userId"));
    const fileCollection = dbClient.dbclient.db().collection('files');
    const filter = {
        "_id": new ObjectID(job.data.fileId),
        "userId": new ObjectID(job.data.userId)
    };
    let file = await fileCollection.findOne(filter);
    console.log(file)
    if (!file) done(new Error("File not found"));
    let option1 = { width: 500 };
    let option2 = { width: 250 };
    let option3 = { width: 100 };
    try {
        console.log(`${file.localPath}_${option1.width}`)
        const thumbnail1 = await imageThumbnail('./image.png', option1);
        fs.writeFileSync(`${file.localPath}_${option1.width}`, thumbnail1);
        const thumbnail2 = await imageThumbnail('./image.png', option2);
        fs.writeFileSync(`${file.localPath}_${option2.width}`, thumbnail2);
        const thumbnail3 = await imageThumbnail('./image.png', option3);
        fs.writeFileSync(`${file.localPath}_${option3.width}`, thumbnail3);
        //fileCollection.updateOne(filter, {$set: {}})
        done();
    } catch (err) {
        console.error(err);
    }
});
