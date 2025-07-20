import cds from "@sap/cds";
import { type NextFunction, type Request, type Response } from "express";

import { authClient } from "./authClient";

type Req = Request & { user: cds.User; tenant: string; requestId: string };

const authLogger = cds.log("auth");

export default async function auth(
  req: Req,
  _res: Response,
  next: NextFunction,
) {
  req.requestId = cds.utils.uuid();
  let logOptions = {
    requestId: req.requestId,
    baseUrl: req.baseUrl,
    path: req.path,
    user: req.user,
    method: req.method,
  };

  try {
    const session = await authClient.getSession(undefined, {
      headers: new Headers(req.headers as HeadersInit),
    });
    authLogger.debug("Session retrieved", { session: session, ...logOptions });

    if (!session || !session.data) {
      const err = new Error("No session found");
      authLogger.warn("No session found", logOptions);
      return next(err);
    }

    req.user = new cds.User({
      id: session.data.user.id,
      roles: [],
      attr: {
        userId: session.data.user.id,
        name: session.data.user.name,
        email: session.data.user.email,
        sessionId: session.data.session.id,
        sessionToken: session.data.session.token,
      },
    });
    logOptions.user = req.user;

    authLogger.debug(
      "User (" + session.data.user.email + ") authenticated",
      logOptions,
    );

    next();
  } catch (error) {
    next(error);
  }
}
