import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express';


export function verifyToken(req: Request, res: Response, next: NextFunction) {

  try {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if(!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof decoded !== 'object' || !decoded?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.userId = decoded.userId;

    next();
  } catch (error: any) {
    res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
}

