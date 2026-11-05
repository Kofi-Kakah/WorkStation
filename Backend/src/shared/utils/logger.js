import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

// Cloud Logging recognizes `severity`, not winston's `level`.
const SEVERITY_BY_LEVEL = {
  error: "ERROR",
  warn: "WARNING",
  info: "INFO",
  http: "INFO",
  verbose: "DEBUG",
  debug: "DEBUG",
  silly: "DEBUG",
};

const addSeverity = winston.format((info) => {
  info.severity = SEVERITY_BY_LEVEL[info.level] || "INFO";
  return info;
});

const productionFormat = winston.format.combine(
  addSeverity(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : "";
    const stackStr = stack ? `\n${stack}` : "";
    return `${timestamp} ${level}: ${message}${stackStr}${metaStr}`;
  }),
);

const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (isProduction ? "info" : "debug"),
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: { service: "unified-platform-backend" },
  transports: [new winston.transports.Console()],
});

export default logger;
