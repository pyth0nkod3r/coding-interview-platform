import { beforeAll, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { prisma } from '../src/db/prisma.js';

beforeAll(async () => {
    // Run migrations on test DB
    try {
        console.log('Pushing schema to test DB at:', process.env.DATABASE_URL);
        execSync('npx prisma db push --schema=prisma/schema.sqlite.prisma --accept-data-loss --skip-generate', {
            env: process.env,
            stdio: 'inherit'
        });
    } catch (e) {
        console.error('Failed to migrate test database');
        throw e;
    }
});

afterEach(async () => {
    // Clean up all tables
    const deleteMessage = prisma.message.deleteMany();
    const deleteQuestion = prisma.question.deleteMany();
    const deleteNote = prisma.note.deleteMany();
    const deleteSession = prisma.session.deleteMany();
    const deleteUser = prisma.user.deleteMany();

    await prisma.$transaction([
        deleteMessage,
        deleteQuestion,
        deleteNote,
        deleteSession,
        deleteUser
    ]);
});
