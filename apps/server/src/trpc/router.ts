import { router } from './trpc';
import { userRouter } from './routers/user';
import { courseRouter } from './routers/course';

export const appRouter = router({
  user: userRouter,
  course: courseRouter,
});

export type AppRouter = typeof appRouter;
