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
  UseInterceptors,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dtos/create-task.dto';
import mongoose from 'mongoose';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    _id: string;
    email: string;
  };
}

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async createTask(
    @Body() body: CreateTaskDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.tasksService.createTask(body, req.user._id);
  }

  @Get()
  async getTasks(@Request() req: RequestWithUser) {
    return await this.tasksService.getTasks(req.user._id);
  }

  @Get(':id')
  async getTaskById(@Param('id') id: string, @Request() req: RequestWithUser) {
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) throw new BadRequestException('Invalid ID');

    const task = await this.tasksService.getTaskById(id, req.user._id);
    if (!task) throw new NotFoundException('Task not found');

    return task;
  }

  @Patch(':id')
  async updateTask(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @Request() req: RequestWithUser,
  ) {
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) throw new BadRequestException('Invalid ID');

    const task = await this.tasksService.updateTask(id, body, req.user._id);
    if (!task) throw new NotFoundException('Task not found');

    return task;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('id') id: string, @Request() req: RequestWithUser) {
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) throw new BadRequestException('Invalid ID');

    const task = await this.tasksService.deleteTask(id, req.user._id);
    if (!task) throw new NotFoundException('Task not found');

    return;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTasksFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ) {
    if (!file) throw new BadRequestException('File is required');

    if (
      file.mimetype !==
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
      file.mimetype !== 'application/vnd.ms-excel'
    ) {
      throw new BadRequestException('File must be an Excel file');
    }

    return await this.tasksService.importTasksFromExcel(file, req.user._id);
  }
}
