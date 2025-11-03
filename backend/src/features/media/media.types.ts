import { Express } from 'express';

export type UploadImageRequest = {
  file: Express.Multer.File;
};

export interface UploadImageResponse {
  message: string;
  data?: {
    image: string;
  };
}
