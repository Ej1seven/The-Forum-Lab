declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HOST: string;
      DATABASE: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      REDIS: number;
      PORT: string;
    }
  }
}

export {}
