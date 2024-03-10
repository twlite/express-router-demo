import express from 'express';
import "express-async-errors";
import { join } from 'node:path'
import { setup } from '../src/index.js'

const app = express();

const path = join(import.meta.dirname, 'api');

await setup(app, path);

app.listen(5353, () => {
    console.log('Server is running on port 5353');
});