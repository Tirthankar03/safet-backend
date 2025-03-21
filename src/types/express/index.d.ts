
export {};

declare global {
  namespace Express {
    export interface Request {
      userId?: string;
      cleanBody?: any;
      rawBody?: Buffer;
    }
  }
  
  // Add this to fix the authorization header typing issue
  namespace Express {
    interface Headers {
      authorization?: string;
    }
  }
}