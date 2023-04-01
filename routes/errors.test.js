const { app, server } = require('../index');
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const getTimeString = require('../services/getTimeString');
const CLIENT = 'anonymous';
const ROUTE = `/errors/${CLIENT}`;
const Redis = require('ioredis');
let dbClient, token;

beforeAll(async () => {
   dbClient = new Redis({
      host: 'localhost',
      port: 6379,
      db: 1
   });
   const authResponse = await request(app).post('/auth').send({
      client: 'serverAdmin',
      username: 'serverAdmin',
      password: '83c7249f1ec29c733156'
   });
   token = authResponse.body.token;
});

// @route   GET /new
// @desc    Returns unread errors from given client or error message
// @access  Pivate - Server Admin Only
describe(`GET ${ROUTE}/new`, () => {
   describe('given client name and auth token as cookie', () => {
      test('should specify json in the content type header', async () => {
         const response = await request(app)
            .get(`${ROUTE}/new`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin'
            });
         expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      });
      test('should respond in english if no language or a wrong language is provided', async () => {
         const response = await request(app)
            .get(`${ROUTE}/new`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin',
               lang: 'ru'
            });
         expect(response.body.lang).toBe('en');
      });
      test('should return all unread errors for given client name', async () => {
         const unreadErrorsInDatabase = await dbClient.zrange(`errors:${CLIENT}:unread`, 0, -1) ?? [];
         const response = await request(app)
            .get(`${ROUTE}/new`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin'
            });
         expect(response.body.data.length).toBe(unreadErrorsInDatabase.length);
      });
   });
});

// @route   DELETE /new
// @desc    Given client name and error id delete error from unread
// @desc    errors form database and save it into read errors
// @desc    retruns successful response or error
// @access  Pivate - Server Admin Only
describe(`DELETE ${ROUTE}/new`, () => {
   const testErrorIds = [];
   beforeAll(async () => {
      for (let i = 0; i < 5; i++) {
         const newErrorId = uuidv4();
         const time = getTimeString();
         const errorObject = {
            date: time,
            route: '/auth',
            error: 'some error..' + i,
            client: CLIENT,
            req: {
               client: 'some client' + i,
               username: 'some username' + i,
               password: 'some password' + i,
               lang: 'some lang'
            }
         };
         testErrorIds.push(newErrorId);
         await dbClient.zadd(`errors:${CLIENT}:unread`, parseInt(time), newErrorId);
         await dbClient.call('JSON.SET', `errors:${CLIENT}#${newErrorId}`, '$', JSON.stringify(errorObject));
      }
   });

   describe('given a client name, auth token as cookie and error id', () => {
      test('should specify json in the content type header', async () => {
         const response = await request(app)
            .delete(`${ROUTE}/new`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin',
               id: 'someID'
            });
         expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      });
      test('should respond in english if no language or a wrong language is provided', async () => {
         const response = await request(app)
            .delete(`${ROUTE}/new`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin',
               lang: 'ru',
               id: 'someID'
            });
         expect(response.body.lang).toBe('en');
      });
      test('should remove error id from unread set in database', async () => {
         await request(app)
            .delete(`${ROUTE}/new`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin',
               lang: 'en',
               id: testErrorIds[2]
            });
         const unreadErrors = await dbClient.zrange(`errors:${CLIENT}:unread`, 0, -1);
         expect(unreadErrors).not.toContainEqual(testErrorIds[2]);
      });
      test('should add error id to read set in database', async () => {
         await request(app)
            .delete(`${ROUTE}/new`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin',
               lang: 'en',
               id: testErrorIds[1]
            });
         const readErrors = await dbClient.zrange(`errors:${CLIENT}:read`, 0, -1);
         expect(readErrors).toContainEqual(testErrorIds[1]);
         expect(readErrors).toContainEqual(testErrorIds[2]);
      });
   });

   afterAll(async () => {
      for (let i = 0; i < testErrorIds.length; i++) {
         await dbClient.del(`errors:${CLIENT}#${testErrorIds[i]}`);
         await dbClient.zrem(`errors:${CLIENT}:unread`, testErrorIds[i]);
         await dbClient.zrem(`errors:${CLIENT}:read`, testErrorIds[i]);
      }
   });
});

// @route   GET /old
// @desc    Returns read errors from given client or error
// @access  Pivate - Server Admin Only
describe(`GET ${ROUTE}/old`, () => {
   const testErrorIds = [];
   beforeAll(async () => {
      for (let i = 0; i < 5; i++) {
         const newErrorId = uuidv4();
         const time = getTimeString();
         const errorObject = {
            date: time,
            route: '/auth',
            error: 'some error..' + i,
            client: CLIENT,
            req: {
               client: 'some client' + i,
               username: 'some username' + i,
               password: 'some password' + i,
               lang: 'some lang'
            }
         };
         testErrorIds.push(newErrorId);
         await dbClient.zadd(`errors:${CLIENT}:read`, parseInt(time), newErrorId);
         await dbClient.call('JSON.SET', `errors:${CLIENT}#${newErrorId}`, '$', JSON.stringify(errorObject));
      }
   });

   describe('given client name and auth token as cookie', () => {
      test('should specify json in the content type header', async () => {
         const response = await request(app)
            .get(`${ROUTE}/old`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin'
            });
         expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      });
      test('should respond in english if no language or a wrong language is provided', async () => {
         const response = await request(app)
            .get(`${ROUTE}/old`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin',
               lang: 'ru'
            });
         expect(response.body.lang).toBe('en');
      });
      test('should return all read errors for given client name', async () => {
         const readErrorsInDatabase = await dbClient.zrange(`errors:${CLIENT}:read`, 0, -1) ?? [];
         const response = await request(app)
            .get(`${ROUTE}/old`)
            .set('Cookie', [`serverAdmin-auth-token=${token}`])
            .send({
               client: 'serverAdmin'
            });
         expect(response.body.data.length).toBe(readErrorsInDatabase.length);
      });
   });

   afterAll(async () => {
      for (let i = 0; i < testErrorIds.length; i++) {
         await dbClient.del(`errors:${CLIENT}#${testErrorIds[i]}`);
         await dbClient.zrem(`errors:${CLIENT}:read`, testErrorIds[i]);
      }
   });
});

afterAll(async () => {
   await dbClient.del('clients:serverAdmin:valid-tokens');
   await server.close();
   await dbClient.quit();
});
