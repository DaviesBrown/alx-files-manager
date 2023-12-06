const mocha = require("mocha");
const chai = require("chai");
const expect = chai.expect;

const {dbClient} = require("../utils/db");

describe("dbClient", () => {
    it("should return db alive", () => {
        expect(dbClient.isAlive()).to.deep.equal(true);
    });
    it("should return number of files", async () => {
        expect(await dbClient.nbFiles()).is.greaterThanOrEqual(0);
    });
    it("should return number of users", async () => {
        expect(await dbClient.nbUsers()).is.greaterThanOrEqual(0);
    });
});