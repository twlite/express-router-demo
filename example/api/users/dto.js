import z from 'zod'

const createUserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
});

const updateUserSchema = createUserSchema.partial();

export default {
    validators: [
        {
            schema: createUserSchema,
            triggers: ['POST']
        },
        {
            schema: updateUserSchema,
            triggers: ['PATCH']
        }
    ]
}