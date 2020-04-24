import { Options, diskStorage } from 'multer';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

export default {
  storage: diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp'),
    filename(_, file, cb) {
      const hash = randomBytes(8).toString('HEX');
      const fileName = `${hash}${new Date().getTime()}-${file.originalname}`;
      return cb(null, fileName);
    },
  }),
} as Options;
