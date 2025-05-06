import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return await createdUser.save();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async getUsers() {
    return this.userModel.find().exec();
  }

  async getUserById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
  }

  async updateProfilePicture(id: string, filePath: string) {
    return this.userModel.findByIdAndUpdate(
      id,
      { profilePicture: filePath },
      { new: true },
    );
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) return null;

    if (user.profilePicture) {
      try {
        fs.unlinkSync(user.profilePicture);

        const directoryPath = path.dirname(user.profilePicture);
        if (fs.existsSync(directoryPath)) {
          const files = fs.readdirSync(directoryPath);
          if (files.length === 0) {
            fs.rmdirSync(directoryPath);
          }
        }
      } catch (error) {
        console.error(`Failed to delete profile picture: ${error.message}`);
      }
    }

    return this.userModel.findByIdAndDelete(id);
  }
}
