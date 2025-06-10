import cds from "@sap/cds";
import winston from "winston";
import LokiTransport from "winston-loki";

const { NODE_ENV, LOKI_HOST, LOG_LEVEL } = process.env;

const META_INFORMATION = {
  service: "backend",
  version: "1.0.0",
  environment: NODE_ENV || "development",
  project: "budgetbuddyde",
};

const format = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.align(),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  }),
);

cds.log.Logger = cds.log.winstonLogger({
  level: LOG_LEVEL || "INFO",
  format: format,
  transports: [
    new winston.transports.Console(),
    ...(NODE_ENV === "production" && LOKI_HOST !== undefined && LOKI_HOST !== ""
      ? [
          new LokiTransport({
            host: LOKI_HOST,
            labels: META_INFORMATION,
          }),
        ]
      : []),
  ],
});

export const config = {
  getLogger: (
    name: string = "bb",
    options: Parameters<typeof cds.log>[1] = {
      label: "BudgetBuddy",
    },
  ) => cds.log(name, options),
};
