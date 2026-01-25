import { router } from './trpc';
import { userRouter } from './routers/user';
import { courseRouter } from './routers/course';
import { quizRouter } from './routers/quiz';
import { gamificationRouter } from './routers/gamification';
import { certificateRouter } from './routers/certificate';
import { socialRouter } from './routers/social';
import { lessonRouter } from './routers/lesson';
import { simulationRouter } from './routers/simulation';
import { aiRouter } from './routers/ai';
import { paymentRouter } from './routers/payment';
import { notificationRouter } from './routers/notification';
import { analyticsRouter } from './routers/analytics';

export const appRouter = router({
  user: userRouter,
  course: courseRouter,
  quiz: quizRouter,
  gamification: gamificationRouter,
  certificate: certificateRouter,
  social: socialRouter,
  lesson: lessonRouter,
  simulation: simulationRouter,
  ai: aiRouter,
  payment: paymentRouter,
  notification: notificationRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
