import { router } from './trpc';
import { userRouter } from './routers/user';
import { courseRouter } from './routers/course';
import { quizRouter } from './routers/quiz';
import { gamificationRouter } from './routers/gamification';
import { certificateRouter } from './routers/certificate';
import { socialRouter } from './routers/social';

export const appRouter = router({
  user: userRouter,
  course: courseRouter,
  quiz: quizRouter,
  gamification: gamificationRouter,
  certificate: certificateRouter,
  social: socialRouter,
});

export type AppRouter = typeof appRouter;
