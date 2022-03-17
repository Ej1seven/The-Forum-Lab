"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("dotenv-safe/config");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const constants_1 = require("./constants");
const apollo_server_core_1 = require("apollo-server-core");
const cors_1 = __importDefault(require("cors"));
const ioredis_1 = __importDefault(require("ioredis"));
const typeorm_1 = require("typeorm");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const path_1 = __importDefault(require("path"));
const Updoot_1 = require("./entities/Updoot");
const createUserLoader_1 = require("./utils/createUserLoader");
const createUpdootLoader_1 = require("./utils/createUpdootLoader");
const main = async () => {
    const conn = await (0, typeorm_1.createConnection)({
        type: 'postgres',
        host: process.env.HOST,
        database: process.env.DATABASE,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        logging: true,
        synchronize: true,
        migrations: [path_1.default.join(__dirname, './migrations/*')],
        entities: [Post_1.Post, User_1.User, Updoot_1.Updoot],
        ssl: {
            rejectUnauthorized: false,
        },
    });
    await conn.runMigrations();
    const app = (0, express_1.default)();
    app.set('trust proxy', 1);
    app.use((0, cors_1.default)({
        origin: 'http://localhost:3000',
        credentials: true,
    }));
    const redis = new ioredis_1.default(process.env.REDIS, process.env.HOST);
    const session = require('express-session');
    let RedisStore = require('connect-redis')(session);
    redis.on('error', function (error) {
        console.error('Error encountered: ', error);
    });
    redis.on('connect', function () {
        console.log('Redis connecton establised');
    });
    app.use(session({
        name: constants_1.COOKIE_NAME,
        store: new RedisStore({ client: redis, disableTouch: true }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            sameSite: 'lax',
            secure: constants_1.__prod__,
        },
        saveUninitialized: false,
        secret: 'dsdsfdsfdsfksdfjksa',
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: (0, createUserLoader_1.createUserLoader)(),
            updootLoader: (0, createUpdootLoader_1.createUpdootLoader)(),
        }),
        plugins: [
            (0, apollo_server_core_1.ApolloServerPluginLandingPageGraphQLPlayground)({
                settings: { 'request.credentials': 'include' },
            }),
        ],
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false,
    });
    app.listen(process.env.PORT, () => {
        console.log('server started on localhost:4000');
    });
};
main();
//# sourceMappingURL=index.js.map