import { users } from "../../../database/db.js";

export const GET = (req, res) => {
    const { id } = req.params;
    const user = users.get(id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
}


export const PATCH = (req, res) => {
    const { params, body } = req;

    if (!users.has(params.id)) {
        return res.status(404).json({ message: 'User not found' });
    }

    const userData = users.get(params.id);
    const updatedUserData = {
        ...userData,
        ...body
    };

    users.set(params.id, updatedUserData);

    return res.json(updatedUserData);
}

export const DELETE = (req, res) => {
    const { params } = req;

    if (!users.has(params.id)) {
        return res.status(404).json({ message: 'User not found' });
    }

    users.delete(params.id);

    return res.status(204).end();
}