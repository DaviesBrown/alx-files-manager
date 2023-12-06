const mocha = require("mocha");
const chai = require("chai");
const chai_http = require("chai-http");
chai.use(chai_http);
const expect = chai.expect;

import {app} from "../server";
import AppController from "../controllers/AppController";

describe("AppController", () => {
    it("GET /status", () => {
        chai.request(app).get("/status")
        .end((err, res) => {
            if (err) {
                expect(res).to.have.status(500);
                expect(res.body).to.have.property('message');
            } else {
                expect(res).to.have.status(200);
                expect(res.body).to.deep.equal({"redis": true, "db": true});
            }
        });
    });
    it("GET /stats", async () => {
        chai.request(app).get("/stats")
        .end((err, res) => {
            if (err) {
                expect(res).to.have.status(500);
                expect(res.body).to.have.property('message');
            } else {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property("users").that.is.gte(0);
                expect(res.body).to.have.property("files").that.is.gte(0);
            }
        });
    });
});