import { CONSTANT_VITE_ENV } from "../constants";

const VITE_ENV =
  import.meta.env.VITE_ENVIRONMENT || CONSTANT_VITE_ENV.DEVELOPMENT;

export const BASE_URL =
  VITE_ENV === CONSTANT_VITE_ENV.DEVELOPMENT
    ? import.meta.env.VITE_LOCAL_BASE_URL
    : import.meta.env.VITE_PROD_BASE_URL;
