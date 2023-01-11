const checkToken = require('./check-token');
const request = require('supertest');
const { app, server, writeFileWorker, writeFileQueue } = require('../index');

describe('check-token middleware', () => {
   describe('given a cookie with a JWT', () => {
      test('should call next() if the cookie is valid', async () => {
         const response = await request(app).post('/auth').send({
            username: 'admin',
            password: 'admin',
            client: 'zbl',
            lang: 'de'
         });
         const next = jest.fn();
         const req = {
            body: {
               lang: 'de',
               client: 'zbl'
            },
            cookies: {
               'zbl-auth-token': response.body.token
            }
         };
         checkToken(req, {}, next);
         expect(next).toHaveBeenCalled();
      });
      test('should call res.status() if the cookie is expired', () => {
         const res = {
            status: jest.fn(() => ({
               json: jest.fn()
            }))
         };
         const req = {
            body: {
               lang: 'de',
               client: 'zbl'
            },
            cookies: {
               // expired token
               'zbl-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnQiOiJ6YmwiLCJsYW5nIjoiIiwidXNlciI6ImFkbWluIiwiaWF0IjoxNjczMTIyNTg5LCJleHAiOjE2NzMxMjYxODl9.LZ5e6Q8SR8Kgi7v1Xm1w6LI3ChbMLW-G_pJs2ZaNTQA'
            }
         };
         checkToken(req, res, () => null);
         expect(res.status).toHaveBeenCalled();
      });
      test('should call res.status() if the cookie is invalid', () => {
         const res = {
            status: jest.fn(() => ({
               json: jest.fn()
            }))
         };
         const req = {
            body: {
               lang: 'de',
               client: 'zbl'
            },
            cookies: {
               // wrong token
               'zbl-auth-token': 'eyJhbGcGllbnQiOiJ6YmwiLCJsYW5nIjoiIiwidXNlciI6ImFkbWluIiwiaWF0IjoxNjczMTIyNTg5LCJleHAiOjE2NzMxMjiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbYxODl9.LZ5e6Q8SR8Kgi7v1Xm1w6LI3ChbMLW-G_pJs2ZaNTQA'
            }
         };
         checkToken(req, res, () => null);
         expect(res.status).toHaveBeenCalled();
      });
   });
});

afterAll(async () => {
   server.close();
   await writeFileWorker.close();
   await writeFileQueue.close();
});
