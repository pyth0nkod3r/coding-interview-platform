// scripts/verify_api.ts
// E2E API verification script - tests all endpoints against running server

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

const results: TestResult[] = [];
let authToken = '';
let userId = '';
let sessionId = '';
let questionId = '';
let messageId = '';

async function request(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
    };

    // Only set Content-Type for requests with body
    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    return fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
        results.push({ name, passed: true });
        console.log(`✅ ${name}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ name, passed: false, error: errorMessage });
        console.log(`❌ ${name}: ${errorMessage}`);
    }
}

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

// ============================================
// Authentication Tests
// ============================================

async function testHealth(): Promise<void> {
    await test('GET /health', async () => {
        const res = await fetch(`${BASE_URL.replace('/api/v1', '')}/health`);
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.status === 'ok', 'Expected status ok');
    });
}

async function testSignup(): Promise<void> {
    await test('POST /auth/signup - Create interviewer', async () => {
        const username = `interviewer_${Date.now()}`;
        const res = await request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                username,
                email: `${username}@test.com`,
                role: 'interviewer',
            }),
        });
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        const data = await res.json();
        assert(data.token, 'Expected token');
        assert(data.user.role === 'interviewer', 'Expected interviewer role');
        authToken = data.token;
        userId = data.user.id;
    });
}

async function testLogin(): Promise<void> {
    await test('POST /auth/login - Login existing user', async () => {
        // First create a user
        const username = `logintest_${Date.now()}`;
        await request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                username,
                email: `${username}@test.com`,
                role: 'candidate',
            }),
        });

        // Then login
        const res = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username }),
        });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.token, 'Expected token');
    });
}

async function testGetMe(): Promise<void> {
    await test('GET /auth/me - Get current user', async () => {
        const res = await request('/auth/me');
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.id === userId, 'Expected user id to match');
    });
}

async function testLogout(): Promise<void> {
    await test('POST /auth/logout', async () => {
        const res = await request('/auth/logout', { method: 'POST' });
        assert(res.status === 204, `Expected 204, got ${res.status}`);
    });
}

// ============================================
// Session Tests
// ============================================

async function testCreateSession(): Promise<void> {
    await test('POST /sessions - Create session', async () => {
        const res = await request('/sessions', { method: 'POST' });
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        const data = await res.json();
        assert(data.id, 'Expected session id');
        assert(data.status === 'active', 'Expected active status');
        sessionId = data.id;
    });
}

async function testGetSessions(): Promise<void> {
    await test('GET /sessions - List sessions', async () => {
        const res = await request('/sessions');
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array');
        assert(data.length > 0, 'Expected at least one session');
    });
}

async function testGetSession(): Promise<void> {
    await test('GET /sessions/:id - Get session', async () => {
        const res = await request(`/sessions/${sessionId}`);
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.id === sessionId, 'Expected correct session id');
    });
}

async function testUpdateSession(): Promise<void> {
    await test('PATCH /sessions/:id - Update session', async () => {
        const res = await request(`/sessions/${sessionId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                codeState: {
                    code: 'function hello() { return "world"; }',
                    language: 'javascript',
                },
            }),
        });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.codeState.code.includes('hello'), 'Expected updated code');
    });
}

// ============================================
// Permission Tests
// ============================================

async function testToggleTyping(): Promise<void> {
    await test('POST /sessions/:id/permissions/typing - Toggle typing', async () => {
        // Debug: Get session first to check interviewerId
        const sessionRes = await request(`/sessions/${sessionId}`);
        const session = await sessionRes.json();

        const res = await request(`/sessions/${sessionId}/permissions/typing`, { method: 'POST' });
        if (!res.ok) {
            const errorBody = await res.json();
            console.log(`  Debug: userId=${userId}, sessionId=${sessionId}, interviewerId=${session.interviewerId}`);
            console.log(`  Error body:`, errorBody);
        }
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(typeof data.canCandidateType === 'boolean', 'Expected boolean');
    });
}

async function testToggleRun(): Promise<void> {
    await test('POST /sessions/:id/permissions/run - Toggle run', async () => {
        const res = await request(`/sessions/${sessionId}/permissions/run`, { method: 'POST' });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(typeof data.canCandidateRun === 'boolean', 'Expected boolean');
    });
}

// ============================================
// Question Tests
// ============================================

async function testAddQuestion(): Promise<void> {
    await test('POST /sessions/:id/questions - Add question', async () => {
        const res = await request(`/sessions/${sessionId}/questions`, {
            method: 'POST',
            body: JSON.stringify({
                title: 'Two Sum',
                content: 'Given an array of integers...',
            }),
        });
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        const data = await res.json();
        assert(data.title === 'Two Sum', 'Expected question title');
        questionId = data.id;
    });
}

async function testGetQuestions(): Promise<void> {
    await test('GET /sessions/:id/questions - List questions', async () => {
        const res = await request(`/sessions/${sessionId}/questions`);
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array');
        assert(data.length > 0, 'Expected at least one question');
    });
}

async function testUpdateQuestion(): Promise<void> {
    await test('PUT /sessions/:id/questions/:qid - Update question', async () => {
        const res = await request(`/sessions/${sessionId}/questions/${questionId}`, {
            method: 'PUT',
            body: JSON.stringify({
                title: 'Updated Two Sum',
                content: 'Updated description...',
            }),
        });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.title === 'Updated Two Sum', 'Expected updated title');
    });
}

async function testDeleteQuestion(): Promise<void> {
    await test('DELETE /sessions/:id/questions/:qid - Delete question', async () => {
        // First add another question to delete
        const addRes = await request(`/sessions/${sessionId}/questions`, {
            method: 'POST',
            body: JSON.stringify({ title: 'To Delete', content: 'Will be deleted' }),
        });
        const { id } = await addRes.json();

        const res = await request(`/sessions/${sessionId}/questions/${id}`, { method: 'DELETE' });
        assert(res.status === 204, `Expected 204, got ${res.status}`);
    });
}

// ============================================
// Message Tests
// ============================================

async function testSendMessage(): Promise<void> {
    await test('POST /sessions/:id/messages - Send message', async () => {
        const res = await request(`/sessions/${sessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: 'Hello, this is a test message!' }),
        });
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        const data = await res.json();
        assert(data.content === 'Hello, this is a test message!', 'Expected message content');
        messageId = data.id;
    });
}

async function testGetMessages(): Promise<void> {
    await test('GET /sessions/:id/messages - List messages', async () => {
        const res = await request(`/sessions/${sessionId}/messages`);
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array');
        assert(data.length > 0, 'Expected at least one message');
    });
}

// ============================================
// Notes Tests
// ============================================

async function testUpdateNotes(): Promise<void> {
    await test('PUT /sessions/:id/notes - Update notes', async () => {
        const res = await request(`/sessions/${sessionId}/notes`, {
            method: 'PUT',
            body: JSON.stringify({ notes: 'These are my private notes' }),
        });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.notes === 'These are my private notes', 'Expected notes');
    });
}

async function testGetNotes(): Promise<void> {
    await test('GET /sessions/:id/notes - Get notes', async () => {
        const res = await request(`/sessions/${sessionId}/notes`);
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.notes === 'These are my private notes', 'Expected notes');
    });
}

// ============================================
// Code Execution Tests
// ============================================

async function testExecuteCode(): Promise<void> {
    await test('POST /code/execute - Execute JavaScript', async () => {
        const res = await request('/code/execute', {
            method: 'POST',
            body: JSON.stringify({
                code: 'console.log("Hello from verify script!");',
                language: 'javascript',
            }),
        });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.output.includes('Hello from verify script!'), 'Expected output');
    });
}

// ============================================
// Session End Test
// ============================================

async function testEndSession(): Promise<void> {
    await test('POST /sessions/:id/end - End session', async () => {
        const res = await request(`/sessions/${sessionId}/end`, { method: 'POST' });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.status === 'ended', 'Expected ended status');
    });
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
    console.log('\n🔍 Starting API Verification...\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    // Run tests in order
    await testHealth();

    // Auth
    await testSignup();
    await testLogin();
    await testGetMe();

    // Sessions
    await testCreateSession();
    await testGetSessions();
    await testGetSession();
    await testUpdateSession();

    // Permissions
    await testToggleTyping();
    await testToggleRun();

    // Questions
    await testAddQuestion();
    await testGetQuestions();
    await testUpdateQuestion();
    await testDeleteQuestion();

    // Messages
    await testSendMessage();
    await testGetMessages();

    // Notes
    await testUpdateNotes();
    await testGetNotes();

    // Code
    await testExecuteCode();

    // End session
    await testEndSession();

    // Logout (last)
    await testLogout();

    // Summary
    console.log('\n' + '='.repeat(50));
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

    if (failed > 0) {
        console.log('Failed tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
        process.exit(1);
    } else {
        console.log('✅ All API endpoints verified successfully!\n');
        process.exit(0);
    }
}

main().catch((err) => {
    console.error('Verification script failed:', err);
    process.exit(1);
});
