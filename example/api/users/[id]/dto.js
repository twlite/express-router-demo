import { createUserSchema } from "../dto.js";

const updateUserSchema = createUserSchema.partial();

export default {
    validators: [
        {
            schema: updateUserSchema,
            triggers: ['PATCH']
        }
    ]
}