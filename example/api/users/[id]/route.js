import { users } from "../../../database/db.js";

export const GET = (req, res) => {
    const { id } = req.params;
    const user = users.get(id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
}