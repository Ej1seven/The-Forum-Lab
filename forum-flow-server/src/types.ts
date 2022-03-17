import { Request, Response } from 'express';
import session from 'express-session';
import { Redis } from 'ioredis';
import { createUpdootLoader } from './utils/createUpdootLoader';
import { createUserLoader } from './utils/createUserLoader';
//defines the MyContext type to ensure Typescript does not prompt an error
export type MyContext = {
  //defines the types for Request,Response, and session from express
  //The req object represents the HTTP request and has properties for the request query string, parameters, body, HTTP headers, and so on
  //the session store or access session data
  req: Request & { session: session.Session };
  //The res object represents the HTTP response that an Express app sends when it gets an HTTP request.
  res: Response;
  //defines the redis type which will be used to cache data frequently accessed by the server
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
//defines the userId type that will be used by the requested session
declare module 'express-session' {
  interface Session {
    userId: number;
  }
}
