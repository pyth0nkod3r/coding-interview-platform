// src/types/fastify.d.ts
// Type declarations for Fastify plugins

import '@fastify/jwt';

declare module 'fastify' {
    interface FastifyInstance {
        jwt: {
            sign: (payload: { id: string; username: string; role: string }) => string;
            verify: (token: string) => { id: string; username: string; role: string };
        };
    }

    interface FastifyRequest {
        user: {
            id: string;
            username: string;
            role: string;
        };
        jwtVerify: () => Promise<void>;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { id: string; username: string; role: string };
        user: { id: string; username: string; role: string };
    }
}
