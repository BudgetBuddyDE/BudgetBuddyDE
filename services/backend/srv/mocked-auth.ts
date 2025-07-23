import cds from "@sap/cds";
import { type NextFunction, type Request, type Response } from "express";

type Req = Request & { user: cds.User; tenant: string; requestId: string };

export default async function auth(
  req: Req,
  _res: Response,
  next: NextFunction,
) {
  req.user = new cds.User({
    id: "i0b03rccMH1PONo69pf1hBJOLYGcugXj",
    roles: [],
    attr: {
      userId: "i0b03rccMH1PONo69pf1hBJOLYGcugXj",
      name: "John Doe",
      email: "john.doe@budget-buddy.de",
      sessionId: cds.utils.uuid(),
      sessionToken: cds.utils.uuid(),
    },
  });

  next();
}
