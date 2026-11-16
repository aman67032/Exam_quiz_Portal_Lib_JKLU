import express from 'express';

const INTEGER_PARAMS = ['paper_id', 'course_id', 'user_id', 'contest_id', 'question_id', 'id'];

/**
 * Create an Express 4 Router whose async handlers forward rejections to the
 * global error handler and whose integer route parameters are validated up front.
 */
export function createAsyncRouter() {
  const router = express.Router();

  for (const paramName of INTEGER_PARAMS) {
    router.param(paramName, (_req, res, next, value) => {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        res.status(400).json({ detail: `Invalid ${paramName.replace(/_/g, ' ')}` });
        return;
      }
      next();
    });
  }

  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const original = router[method].bind(router);
    router[method] = (routePath, ...handlers) => {
      const wrapped = handlers.map((fn) =>
        typeof fn === 'function' && fn.length < 4
          ? (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
          : fn
      );
      return original(routePath, ...wrapped);
    };
  }
  return router;
}
