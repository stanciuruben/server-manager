const { app, server } = require('../index');
const request = require('supertest');
const ROUTE = '/logout';
const Redis = require('ioredis');
const getTimeString = require('../services/getTimeString');
let dbClient;

beforeAll(() => {
   dbClient = new Redis({
      host: 'localhost',
      port: 6379,
      db: 1
   });
});

describe(`POST ${ROUTE}`, () => {
   describe('given client name and auth token as cookie', () => {
      test('should respond in english if no language or a wrong language is provided', async () => {
         const response = await request(app).post(ROUTE)
            .set('Cookie', ['zbl-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnQiOiJ6YmwiLCJsYW5nIjoiIiwidXNlciI6ImFkbWluIiwiaWF0IjoxNjczMTIyNTg5LCJleHAiOjE2NzMxMjYxODl9.LZ5e6Q8SR8Kgi7v1Xm1w6LI3ChbMLW-G_pJs2ZaNTQA'])
            .send({
               client: 'zbl'
            });
         expect(response.body.lang).toBe('en');
      });
      test('should remove provided token from valid-tokens list in database', async () => {
         const client = 'zbl';
         // Login and get a token
         const loginRes = await request(app).post('/auth').send({
            username: 'admin',
            password: 'admin',
            client,
            lang: 'de'
         });
         const token = loginRes.body.token;
         // Logout and check if provided token gets removed from database
         const logoutRes = await request(app).post(ROUTE)
            .set('Cookie', [`${client}-auth-token=${token}`])
            .send({
               client
            });
         expect(logoutRes.statusCode).toBe(200);
         // Get valid tokens in the last hour from database
         const validTokensInDatabase = await dbClient.zrangebyscore(`clients:${client}:valid-tokens`, getTimeString('-1h'), '+inf');
         const isTokenInDatabase = validTokensInDatabase.includes(token);
         expect(isTokenInDatabase).toBe(false);
      });
      test('should respond with 400 status code if client name is missing or invalid', async () => {
         const response1 = await request(app).post(ROUTE)
            .set('Cookie', ['zbl-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnQiOiJ6YmwiLCJsYW5nIjoiIiwidXNlciI6ImFkbWluIiwiaWF0IjoxNjczMTIyNTg5LCJleHAiOjE2NzMxMjYxODl9.LZ5e6Q8SR8Kgi7v1Xm1w6LI3ChbMLW-G_pJs2ZaNTQA'])
            .send();
         expect(response1.statusCode).toBe(400);
         const response2 = await request(app).post(ROUTE)
            .set('Cookie', ['zbl-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnQiOiJ6YmwiLCJsYW5nIjoiIiwidXNlciI6ImFkbWluIiwiaWF0IjoxNjczMTIyNTg5LCJleHAiOjE2NzMxMjYxODl9.LZ5e6Q8SR8Kgi7v1Xm1w6LI3ChbMLW-G_pJs2ZaNTQA'])
            .send({
               client: 'amazon'
            });
         expect(response2.statusCode).toBe(400);
      });
      test('should respond with 400 status code if token is missing', async () => {
         const response = await request(app).post(ROUTE)
            .send({
               client: 'zbl'
            });
         expect(response.statusCode).toBe(400);
      });
   });
});

afterAll(async () => {
   server.close();
   dbClient.quit();
});
