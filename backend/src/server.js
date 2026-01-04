
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { handler } from './handlers/api.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Keep-alive for Windows/Node environment
setInterval(() => { }, 10000);

// Wrapper to convert Express req to Lambda event
const lambdaWrapper = (httpMethod, resourcePath) => async (req, res) => {
    const event = {
        httpMethod,
        path: resourcePath, // Use the fixed resource path, or req.path if strict mapping isn't needed
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

// Map routes from handler/api.js
app.post('/alerts', lambdaWrapper('POST', '/alerts'));
app.get('/alerts', lambdaWrapper('GET', '/alerts'));
app.delete('/alerts/:id', async (req, res) => {
    // Manually reconstruct path for delete
    const event = {
        httpMethod: 'DELETE',
        path: `/alerts/${req.params.id}`,
        queryStringParameters: req.query,
        body: JSON.stringify(req.body)
    };
    const result = await handler(event);
    res.status(result.statusCode).set(result.headers).send(result.body);
});

// AI Routes
app.post('/generate/summary', lambdaWrapper('POST', '/generate/summary'));
app.post('/generate/quiz', lambdaWrapper('POST', '/generate/quiz'));

app.listen(PORT, () => {
    console.log(`Backend server running locally at http://localhost:${PORT}`);
});
