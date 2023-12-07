const mocha = require('mocha');
const chai = require('chai');

const { expect } = chai;

const { redisClient } = require('../utils/redis');

describe('redisClient', () => {
  it('should return rdb alive', () => {
    expect(redisClient.isAlive()).to.deep.equal(true);
  });
  it('should set a (key val exp)', async () => {
    await redisClient.set('key', 'val', '5');
    expect(await redisClient.get('key')).to.deep.equal('val');
  });
  it('should get a val by key after exp', async () => {
    setTimeout(async () => {
      expect(await redisClient.get('key')).to.deep.equal(null);
    }, 10000);
  });
  it('should del a val by key', async () => {
    await redisClient.del('key');
    expect(await redisClient.get('key')).to.deep.equal(null);
  });
});
