import { EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { Request, Response } from 'express';
import session from 'express-session';
import { Redis } from 'ioredis';
//defines the MyContext type to ensure Typescript does not prompt an error
export type MyContext = {
  //defines the type for entities within MikroOrm
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  //defines the types for Request,Response, and session from express
  //The req object represents the HTTP request and has properties for the request query string, parameters, body, HTTP headers, and so on
  //the session store or access session data
  req: Request & { session: session.Session };
  //The res object represents the HTTP response that an Express app sends when it gets an HTTP request.
  res: Response;
  redis: Redis;
};
//defines the userId type that will be set during the login request
declare module 'express-session' {
  interface Session {
    userId: number;
  }
}
