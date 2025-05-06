import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import mongoose from 'mongoose';
import { UpdateUserDto } from './dtos/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserResponseDto } from './dtos/user-response.dto';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { profilePictureStorage } from '../common/interceptors/profilepic.interceptor';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UseInterceptors(new TransformInterceptor(UserResponseDto))
  async createUser(@Body() body: CreateUserDto) {
    return await this.usersService.createUser(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @UseInterceptors(new TransformInterceptor(UserResponseDto))
  async getUsers() {
    return await this.usersService.getUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @UseInterceptors(new TransformInterceptor(UserResponseDto))
  async getProfile(@Request() req: Express.Request) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @UseInterceptors(new TransformInterceptor(UserResponseDto))
  async getUserById(@Param('id') id: string) {
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) throw new BadRequestException('Invalid ID');

    const user = await this.usersService.getUserById(id);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(new TransformInterceptor(UserResponseDto))
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) throw new BadRequestException('Invalid ID');

    const user = await this.usersService.updateUser(id, body);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/profile-picture')
  @UseInterceptors(
    FileInterceptor('file', profilePictureStorage),
    new TransformInterceptor(UserResponseDto),
  )
  async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) throw new BadRequestException('Invalid ID');

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const user = await this.usersService.updateProfilePicture(id, file.path);
    if (!user) throw new NotFoundException('User not found');

    return { message: 'Profile picture uploaded successfully', user };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) throw new BadRequestException('Invalid ID');

    const user = await this.usersService.deleteUser(id);
    if (!user) throw new NotFoundException('User not found');

    return;
  }
}
