// Market Pulse — session middleware.
//
// Deliberately not a full authentication system (section 23: "do not spend
// most of the hackathon building a complicated auth system"). Every visitor
// gets a lightweight, server-issued session bound to an httpOnly cookie —
// no password, no signup screen blocking the first five seconds of the
// product. What IS real: the authorization boundary. Every route below
// resolves `req.userId` from the signed session cookie server-side; nothing
// ever trusts a userId supplied by the client in a header, query string, or
// body. Swapping this for real login later (password/OAuth) only touches
// this file and userRepository — no route or service changes.

import type { NextFunction, Request, Response } from 'express';
import { createUserWithSession, extendSession, resolveSession } from '../repositories/userRepository';

const COOKIE_NAME = 'mp_session';
const COOKIE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME] as string | undefined;
    const session = await resolveSession(token);

    if (session) {
      req.userId = session.userId;
      extendSession(token!).catch(() => undefined);
      return next();
    }

    const created = await createUserWithSession();
    req.userId = created.userId;
    res.cookie(COOKIE_NAME, created.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE_MS,
    });
    next();
  } catch (err) {
    next(err);
  }
}
