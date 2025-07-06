import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

class UtilityService {
  hashPassword = async (password: string) => {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  };

  validatePassword = (password: string, hashedPassword: string) => {
    return bcrypt.compare(password, hashedPassword);
  };

  getUUID() {
    return uuidv4();
  }
}

export const UtilService = new UtilityService();
