import 'reflect-metadata';
import 'dotenv/config';
//Importing MikroORM - A typescript ORM used to query data from the AWS Postgres database
//Importing configuration data needed to initialize MikroOrm
//server framework used to build JSON APIs
import express from 'express';
// Apollo Server is open-source GraphQL server that works with many Node.js HTTP server frameworks
//provides an way to build a production-ready, self-documenting GraphQL APIs
import { ApolloServer } from 'apollo-server-express';
//buildSchema defines the entities that exist but also the different queries and mutations that are possible to make
//it also includes resolvers which are functions that are invoked when the user makes a query or mutation
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
//PostResolver is used query or mutate the Post table
import { PostResolver } from './resolvers/post';
//UserResolver is used query or mutate the Users table
import { UserResolver } from './resolvers/user';
//__prod__ is used to notify the server when the application is in production mode
import { COOKIE_NAME, __prod__ } from './constants';
//used to revert the Apollo Server GUI to the previous version
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
//cors tells the server to include the proper header on every response
import cors from 'cors';
import Redis from 'ioredis';
import { createConnection } from 'typeorm';
import { Post } from './entities/Post';
import { User } from './entities/User';
import path from 'path';
import { Updoot } from './entities/Updoot';
import { createUserLoader } from './utils/createUserLoader';
import { createUpdootLoader } from './utils/createUpdootLoader';

//Async statement used to connect TypeORM to my Postgres database and initialize redis / apollo server
const main = async () => {
  //conn is used to configure my postgres db to connect to TypeOrm
  const conn = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    // synchronize: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, User, Updoot],
  });
  await conn.runMigrations();
  //
  // await Post.delete({});

  const app = express();

  //It's an open source tool that runs as a service in the background that allows you to store data in memory for high-performance data retrieval and storage
  //Redis will be used in this application as a cache to store frequently accessed data in memory i.e(sessions).
  const redis = new Redis(process.env.REDIS_URL);
  //When the client makes a login request to the server, the server will create a session and store it on the server-side.
  //When the server responds to the client, it sends a cookie.
  //This cookie will contain the session’s unique id stored on the server, which will now be stored on the client.
  const session = require('express-session');
  //RedisStore connects Redis to the session created by the server
  //This allows Redis to now store the session in cache
  let RedisStore = require('connect-redis')(session);
  //The two following checks to see if Redis is connected or not
  redis.on('error', function (error) {
    console.error('Error encountered: ', error);
  });
  redis.on('connect', function () {
    console.log('Redis connecton establised');
  });
  app.set('trust proxy', 1);
  //tells the server to include the front-end url to the http header on every response
  //doing this ensures the client and server have matching origins preventing any errors
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      //setting credentials to true allows for cookies to be passed through the http header
      credentials: true,
    })
  );
  //Server created a session through Apollo Server
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: 'lax', // csrf
        secure: __prod__, // cookie only works in https
        domain: __prod__ ? '.theforumlab.com' : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );
  //Apollo server creates a schema for queries, mutations, and resolvers
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }),
    //This plugin reverts back to the graphql playground to allow cookies to be passed between the server and the client
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground({
        settings: { 'request.credentials': 'include' },
      }),
    ],
  });
  //This following function start apollo server and applies the needed middleware
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    //setting cors to false makes sure no changes are made to the cors policy
    //we have already configured cors in the server so there is no need to make cors configurations in apolloServer
    cors: false,
  });
  //The server listens for traffic on designated port
  app.listen(process.env.PORT, () => {
    console.log('The server has started');
  });
};
//the async function initializes the server and redis
main().catch((err) => {
  console.error(err);
});
