//Importing MikroORM - A typescript ORM used to query data from the AWS Postgres database
import { MikroORM } from '@mikro-orm/core';
//Importing the __prod__ variable from the constant.ts file. This variable makes sure the server only debugs in the development environment and not while in production
import { __prod__ } from './constants';
import { Post } from './entities/Post';
//path is a node module that allows you to interact with file paths easily
import path from 'path';
import { User } from './entities/User';
//Importing dotenv to allow for environment variables
require('dotenv').config();
//Environment variables used to connect MikroORM to my AWS Postgres database
const databaseName = process.env.DBNAME;
const host = process.env.HOST;
const username = process.env.USER;
const password = process.env.PASSWORD;

//Configuration data needed to connect MikroOrm to Postgres database and form new migration
export default {
  migrations: {
    // absolute path to the directory containing the source file
    path: path.join(__dirname, './migrations'), // path to the folder with migrations
    glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
  },
  entities: [Post, User],
  dbName: databaseName,
  host: host,
  user: username,
  password: password,
  type: 'postgresql',
  debug: !__prod__,
  allowGlobalContext: true,
} as Parameters<typeof MikroORM.init>[0];
