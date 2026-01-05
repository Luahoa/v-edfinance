import { NextResponse } from 'next/server';

interface MockResponse {
  [key: string]: unknown;
}

interface MockDB {
  GET: MockResponse;
  POST: MockResponse;
}

const mockData: MockDB = {
  "GET": {
    "users/dashboard-stats": {
      "points": 1250,
      "streak": 7,
      "nextLevel": 2000,
      "rank": "Silver"
    },
    "store/items": [
      {
        "id": "streak-freeze",
        "name": {
          "vi": "Đóng băng chuỗi",
          "en": "Streak Freeze",
          "zh": "连胜冻结"
        },
        "description": {
          "vi": "Mô tả",
          "en": "Desc",
          "zh": "描述"
        },
        "price": 100
      }
    ],
    "social/feed": [],
    "social/recommendations": [],
    "checklists": []
  },
  "POST": {
    "auth/register": {
      "user": {
        "id": "test-user",
        "email": "test@example.com"
      },
      "token": "mock-token"
    },
    "ai/threads": {
      "id": "thread-1",
      "title": "Test Thread"
    }
  }
};

export async function GET(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join('/');
  
  const responses = mockData.GET;
  const match = Object.keys(responses).find(key => slug.includes(key));
  
  if (match) {
    return NextResponse.json(responses[match]);
  }

  return NextResponse.json([]);
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join('/');
  
  const responses = mockData.POST;
  const match = Object.keys(responses).find(key => slug.includes(key));
  
  if (match) {
    const response = responses[match];
    if (slug.includes('ai/threads')) {
      return NextResponse.json({ 
        ...response, 
        updatedAt: new Date().toISOString() 
      }, { status: 201 });
    }
    if (slug.includes('auth/register')) {
      return NextResponse.json(response, { status: 201 });
    }
    return NextResponse.json(response);
  }

  return NextResponse.json({ message: 'Mock POST response', success: true });
}
