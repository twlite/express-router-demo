import { randomUUID } from 'node:crypto'
import { users } from '../../database/db.js';

export const GET = (req, res) => {
    return res.json(Array.from(users.values()));
}

export const POST = (req, res) => {
    const { body } = req;

    const id = randomUUID();
    const userData = {
        ...body,
        id
    };

    users.set(id, userData);

    return res.json(userData);
}
