import { config } from "dotenv";

config({
  path: "./.env",
});

const env = {
  PORT: process.env.PORT!,
  MONGO_URI: process.env.MONGO_URI!,
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: process.env.SMTP_PORT!,
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASS: process.env.SMTP_PASS!,
  NODE_ENV: process.env.NODE_ENV!,
  USER_EMAIL: process.env.USER_EMAIL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  FRONTEND_ROUTE: process.env.FRONTEND_ROUTE!,
  IMAGEKIT_PRIVATE_API_KEY: process.env.IMAGEKIT_PRIVATE_API_KEY!,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT!,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY!,
};

export default env;
