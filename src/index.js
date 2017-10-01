const express = require('express');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');

const {execute, subscribe} = require('graphql');
const {createServer} = require('http');
const {SubscriptionServer} = require('subscriptions-transport-ws');

const schema = require('./schema');
const buildDataloaders = require('./dataloaders');

// 1
const connectMongo = require('./mongo-connector');
const {authenticate} = require('./authentication');
const formatError = require('./formatError');

const PORT = 3000;

// 2
const start = async () => {
    // 3
    const mongo = await connectMongo();
    let app = express();
    const buildOptions = async (req, res) => {
        const user = await authenticate(req, mongo.Users);
        return {
            context: {
                dataloaders: buildDataloaders(mongo),
                mongo,
                user,

            }, // This context object is passed to all resolvers.
            formatError,
            schema,
        };
    };
    app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));
    app.use('/graphiql', graphiqlExpress({
        passHeader: "'Authorization': 'bearer token-roman.sarder@yandex.ru'",
        endpointURL: '/graphql',
        subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
    }));

    const server = createServer(app);
    server.listen(PORT, () => {
        SubscriptionServer.create(
            {execute, subscribe, schema},
            {server, path: '/subscriptions'},
        );
        console.log(`Hackernews GraphQL server running on port ${PORT}.`)
    });
};

// 5
start();