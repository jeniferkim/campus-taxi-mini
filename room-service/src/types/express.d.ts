// req.user 타입 확장

import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      name: string;
    };
  }
}
