"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@mikro-orm/core");
const constants_1 = require("./constants");
const Post_1 = require("./entities/Post");
require('dotenv').config();
const databaseName = process.env.DBNAME;
const host = process.env.HOST;
const username = process.env.USER;
const password = process.env.PASSWORD;
const main = async () => {
    const orm = await core_1.MikroORM.init({
        entities: [Post_1.Post],
        dbName: databaseName,
        host: host,
        user: username,
        password: password,
        type: 'postgresql',
        debug: !constants_1.__prod__,
        allowGlobalContext: true,
    });
    const post = orm.em.create(Post_1.Post, { name: 'my first post' });
    await orm.em.persistAndFlush(post);
    console.log('----------------sql 2------------');
    await orm.em.nativeInsert(Post_1.Post, { name: 'my first post 2' });
};
main();
//# sourceMappingURL=index.js.map