# Frontend Tooling Guide

This document provides a comprehensive guide to the frontend libraries installed in the V-EdFinance project.

## Table of Contents
1. [Shadcn UI](#shadcn-ui)
2. [Tiptap (Rich Text Editor)](#tiptap-rich-text-editor)
3. [React Player](#react-player)
4. [Framer Motion](#framer-motion)
5. [TanStack Query](#tanstack-query)
6. [Canvas Confetti](#canvas-confetti)
7. [Vercel AI SDK](#vercel-ai-sdk)

---

## Shadcn UI

**Repo:** [shadcn-ui/ui](https://github.com/shadcn-ui/ui)
**CLI:** Installed as `shadcn` (can be run via `pnpm shadcn`).

Shadcn UI is not a component library in the traditional sense. It's a collection of re-usable components that you can copy and paste into your apps.

### How to use
Add a component to your project using the CLI:

```bash
pnpm shadcn add button
pnpm shadcn add card
pnpm shadcn add dialog
```

This will download the component code directly into `apps/web/src/components/ui`. You can then customize the code as needed.

### Example
```tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div>
      <Button variant="outline">Click me</Button>
    </div>
  )
}
```

---

## Tiptap (Rich Text Editor)

**Repo:** [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap)

Headless, framework-agnostic rich text editor.

### Installation
Already installed: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`.

### Usage
Create a simple editor component:

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const Tiptap = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World! 🌍️</p>',
  })

  return <EditorContent editor={editor} />
}
```

---

## React Player

**Repo:** [cookpete/react-player](https://github.com/cookpete/react-player)

A React component for playing a variety of URLs, including YouTube, Facebook, Twitch, SoundCloud, Streamable, Vimeo, Wistia, Mixcloud, DailyMotion and Kaltura.

### Usage
Note: To avoid hydration errors in Next.js, use dynamic import or render only on client.

```tsx
'use client'
import ReactPlayer from 'react-player'

// Or dynamic import
// import dynamic from 'next/dynamic'
// const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function VideoSection() {
  return (
    <ReactPlayer 
      url='https://www.youtube.com/watch?v=ysz5S6PZMNY' 
      controls={true}
      width="100%"
    />
  )
}
```

---

## Framer Motion

**Repo:** [framer/motion](https://github.com/framer/motion)

A production-ready motion library for React.

### Usage

```tsx
'use client'
import { motion } from "framer-motion"

export const MyComponent = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    Animated Content
  </motion.div>
)
```

---

## TanStack Query

**Repo:** [tanstack/query](https://github.com/tanstack/query)

Powerful asynchronous state management for TS/JS, React, Solid, Vue and Svelte.

### Setup
Ensure you have a `QueryClientProvider` wrapping your app (usually in `layout.tsx` or `providers.tsx`).

```tsx
// providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Usage

```tsx
import { useQuery } from '@tanstack/react-query'

function App() {
  const { isPending, error, data } = useQuery({
    queryKey: ['repoData'],
    queryFn: () =>
      fetch('https://api.github.com/repos/TanStack/query').then((res) =>
        res.json(),
      ),
  })

  if (isPending) return 'Loading...'
  if (error) return 'An error has occurred: ' + error.message

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
    </div>
  )
}
```

---

## Canvas Confetti

**Repo:** [catdad/canvas-confetti](https://github.com/catdad/canvas-confetti)

Performant confetti animation in the browser.

### Usage

```tsx
'use client'
import confetti from 'canvas-confetti'

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

export default function RewardButton() {
  return <button onClick={triggerConfetti}>Celebrate!</button>
}
```

---

## Vercel AI SDK

**Repo:** [vercel/ai](https://github.com/vercel/ai)

A library for building AI-powered streaming text and chat interfaces.

### Usage (Chat Interface)

1. **API Route** (`app/api/chat/route.ts`):
```ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

2. **Client Component**:
```tsx
'use client';

import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
```
