// MSW Handlers - Mock external APIs for testing
import { http, HttpResponse } from 'msw';

export const handlers = [
    // Mock Google Gemini AI API
    http.post('https://generativelanguage.googleapis.com/v1beta/models/*', () => {
        return HttpResponse.json({
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: 'Mock AI response for testing. This is a simulated answer from Gemini.',
                            },
                        ],
                    },
                    finishReason: 'STOP',
                },
            ],
        });
    }),

    // Mock Google Cloud Storage upload
    http.put('https://storage.googleapis.com/upload/storage/v1/*', () => {
        return HttpResponse.json({
            kind: 'storage#object',
            id: 'mock-file-id',
            name: 'test-file.jpg',
            bucket: 'v-edfinance-uploads',
            size: '1024',
        });
    }),

    // Mock Cloudflare R2 presigned URL upload
    http.put('https://*.r2.cloudflarestorage.com/*', () => {
        return new HttpResponse(null, { status: 200 });
    }),

    // Mock Authentication endpoints (for integration tests)
    http.post('http://localhost:3001/api/auth/login', async ({ request }) => {
        const body = await request.json() as { email: string; password: string };

        if (body.email === 'test@example.com' && body.password === 'password123') {
            return HttpResponse.json({
                access_token: 'mock-jwt-token',
                refresh_token: 'mock-refresh-token',
                user: {
                    id: '1',
                    email: 'test@example.com',
                    role: 'STUDENT',
                },
            });
        }

        return new HttpResponse(null, { status: 401 });
    }),

    // Mock Course API
    http.get('http://localhost:3001/api/courses', () => {
        return HttpResponse.json([
            {
                id: '1',
                title: { vi: 'Khóa học tài chính cơ bản', en: 'Basic Finance Course' },
                description: { vi: 'Học tài chính từ cơ bản', en: 'Learn finance from basics' },
                level: 'BEGINNER',
            },
        ]);
    }),
];
