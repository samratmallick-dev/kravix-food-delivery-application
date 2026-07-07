import multer from "multer";
import { Request, Response, NextFunction } from "express";

const multerInstance = multer({ storage: multer.memoryStorage() }).single("image");

export const upload = (req: Request, res: Response, next: NextFunction) => {
        multerInstance(req, res, (err) => {
                if (err) return next(err);
                next();
        });
};