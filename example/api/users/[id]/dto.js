import { createUserSchema } from "../dto";

const updateUserSchema = createUserSchema.partial();

export default {
    validators: [
        {
            schema: updateUserSchema,
            triggers: ['PATCH']
        }
    ]
}