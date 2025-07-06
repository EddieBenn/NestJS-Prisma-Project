import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto, IUser, UserFilter } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UtilService } from '../utils/utility-service';
import { buildUserFilter } from 'src/filters/query-filter';
import { PrismaService } from 'src/prisma/prisma.service';
import { config } from '../config';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(data: CreateUserDto) {
    const { email, password } = data;
    const emailExist = await this.prismaService.users.findUnique({
      where: { email },
    });
    if (emailExist) {
      throw new HttpException(
        `user with email: ${email} already exist`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const hashedPassword = await UtilService.hashPassword(password);

    const createdUser = {
      ...data,
      password: hashedPassword,
    };

    return this.prismaService.users.create({ data: createdUser });
  }

  async getAllUsers(queryParams: UserFilter) {
    const page = queryParams?.page
      ? Number(queryParams?.page)
      : config.DEFAULT_PAGE_NO;
    const size = queryParams?.size
      ? Number(queryParams.size)
      : config.DEFAULT_PER_PAGE;
    const skip = (page - 1) * size;
    const query = await buildUserFilter(queryParams);

    const [users, count] = await Promise.all([
      this.prismaService.users.findMany({
        where: query,
        skip,
        take: size,
        orderBy: { created_at: 'desc' },
      }),
      this.prismaService.users.count({ where: query }),
    ]);

    const totalPages = Math.ceil(count / size);
    return {
      users,
      pagination: {
        totalRows: count,
        perPage: size,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await this.prismaService.users.findUnique({ where: { id } });
    if (!user?.id) {
      throw new HttpException(
        `user with id: ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  async updateUserById(id: string, data: UpdateUserDto) {
    return this.prismaService.users.update({ where: { id }, data });
  }

  async deleteUserById(id: string) {
    return this.prismaService.users.delete({ where: { id } });
  }
}
