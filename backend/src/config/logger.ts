import winston from 'winston';
import { getEnv } from './env';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

const logger = winston.createLogger({
  level: getEnv().LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'erp-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (getEnv().NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      ),
    })
  );
}

export default logger;

