import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
require('dotenv').config();

const databaseName = process.env.DBNAME;
const host = process.env.HOST;
const username = process.env.USER;
const password = process.env.PASSWORD;

const main = async () => {
  const orm = await MikroORM.init({
    entities: [Post],
    dbName: databaseName,
    host: host,
    user: username,
    password: password,
    type: 'postgresql',
    debug: !__prod__,
    allowGlobalContext: true,
  });

  const post = orm.em.create(Post, { name: 'my first post' });
  await orm.em.persistAndFlush(post);
  console.log('----------------sql 2------------');
  await orm.em.nativeInsert(Post, { name: 'my first post 2' });
};

main();
