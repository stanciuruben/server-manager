const { app, server } = require('../index');
const request = require('supertest');
const config = require('config');
const jwt = require('jsonwebtoken');
const ROUTE = '/auth';

describe(`POST ${ROUTE}`, () => {
   describe('given username, password, client name and language', () => {
      test('should specify json in the content type header', async () => {
         const response = await request(app).post(ROUTE).send({
            username: 'admin',
            password: 'admin',
            client: 'zbl'
         });
         expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      });
      test('should respond in english if no language or a wrong language is provided', async () => {
         const response = await request(app).post(ROUTE).send({
            username: 'admin',
            password: 'admin',
            client: 'zbl'
         });
         expect(response.body.lang).toBe('en');
      });
      test('should respond with 200 if username, password and client match', async () => {
         const response = await request(app).post(ROUTE).send({
            username: 'admin',
            password: 'admin',
            client: 'zbl',
            lang: 'de'
         });
         expect(response.statusCode).toBe(200);
      });
      test('should return a JWT with encripted object containing: client, user and language', async () => {
         const response = await request(app).post(ROUTE).send({
            username: 'admin',
            password: 'admin',
            client: 'zbl',
            lang: 'de'
         });
         jwt.verify(response.body.token, config.get('jwtSecret'), (_error, decodedToken) => {
            expect(decodedToken.client).toBe('zbl');
            expect(decodedToken.lang).toBe('de');
            expect(decodedToken.user).toBe('admin');
         });
      });
      test('should respond with 400 if the username is incorrect', async () => {
         const response = await request(app).post(ROUTE).send({
            username: 'admin1',
            password: 'admin',
            client: 'zbl',
            lang: 'de'
         });
         expect(response.statusCode).toBe(400);
      });
      test('should respond with 400 if the password is incorrect', async () => {
         const response = await request(app).post(ROUTE).send({
            username: 'admin',
            password: 'admi1n',
            client: 'zbl',
            lang: 'de'
         });
         expect(response.statusCode).toBe(400);
      });
      test('should respond with 400 if the client is not existent', async () => {
         const response = await request(app).post(ROUTE).send({
            username: 'admin',
            password: 'admin',
            client: 'amazon'
         });
         expect(response.statusCode).toBe(400);
      });
   });
});

afterAll(async () => {
   server.close();
});
