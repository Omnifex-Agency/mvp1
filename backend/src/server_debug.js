
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { handler } from './handlers/api.js';

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Force event loop to stay alive just in case
setInterval(() => {
    // heartbeat
}, 10000);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const lambdaWrapper = (httpMethod, resourcePath) => async (req, res) => {
    const event = {
        httpMethod,
        path: resourcePath,
        queryStringParameters: req.query,
        body: JSON.stringify(req.body),
        headers: req.headers
    };

    try {
        const result = await handler(event);
        res.status(result.statusCode).set(result.headers).send(result.body);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Internal Server Error" });
    }
};

app.post('/alerts', lambdaWrapper('POST', '/alerts'));
app.get('/alerts', lambdaWrapper('GET', '/alerts'));
app.delete('/alerts/:id', async (req, res) => {
    const event = {
        httpMethod: 'DELETE',
        path: `/alerts/${req.params.id}`,
        queryStringParameters: req.query,
        body: JSON.stringify(req.body)
    };
    const result = await handler(event);
    res.status(result.statusCode).set(result.headers).send(result.body);
});

app.post('/generate/summary', lambdaWrapper('POST', '/generate/summary'));
app.post('/generate/quiz', lambdaWrapper('POST', '/generate/quiz'));

const server = app.listen(PORT, () => {
    console.log(`Debug server running locally at http://localhost:${PORT}`);
    console.log(`Node Version: ${process.version}`);
});

server.on('close', () => {
    console.log('Server closed');
});
