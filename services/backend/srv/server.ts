import "dotenv/config";
import cds from "@sap/cds";

const ORIGINS = Object.fromEntries(
  (process.env.ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => [origin, 1]),
);

cds.on("bootstrap", (app) => {
  // FIXME: This is a temporary solution, consider using a more robust CORS middleware in production
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) {
      cds.log("cors").debug("No origin header present in the request");
    }
    cds
      .log("cors")
      .debug(
        `CORS check for ${origin}. Allowed origins: ${Object.keys(ORIGINS).join(", ")}`,
      );

    if (origin && origin in ORIGINS) {
      res
        .set("Access-Control-Allow-Origin", origin)
        .set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE")
        .set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        .set("Access-Control-Allow-Credentials", "true");
      cds.log("cors").debug(`CORS preflight request from ${origin}`);

      if (req.method === "OPTIONS") {
        return res
          .set("access-control-allow-methods", "GET,HEAD,PUT,PATCH,POST,DELETE")
          .end();
      }
      return next();
    }
  });
});
