import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

export const profilePictureStorage = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = 'uploads/profile-pictures';

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const userId = req.params.id;
      const fileExtension = path.extname(file.originalname);
      cb(null, `${userId}${fileExtension}`);
    },
  }),
};
