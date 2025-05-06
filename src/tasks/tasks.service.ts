import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './schemas/task.schema';
import { Model } from 'mongoose';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import * as xlsx from 'xlsx';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  createTask(createTaskDto: CreateTaskDto, userId: string) {
    const createdTask = new this.taskModel({
      ...createTaskDto,
      user: userId,
    });
    return createdTask.save();
  }

  getTasks(userId: string) {
    return this.taskModel.find({ user: userId });
  }

  getTaskById(id: string, userId: string) {
    return this.taskModel.findOne({ _id: id, user: userId });
  }

  updateTask(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    return this.taskModel.findOneAndUpdate(
      { _id: id, user: userId },
      updateTaskDto,
      { new: true },
    );
  }

  deleteTask(id: string, userId: string) {
    return this.taskModel.findOneAndDelete({ _id: id, user: userId });
  }

  async importTasksFromExcel(file: Express.Multer.File, userId: string) {
    try {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      type TaskRow = { title: string; content: string };

      const data = xlsx.utils.sheet_to_json<TaskRow>(worksheet);

      if (!data || data.length === 0) {
        throw new BadRequestException('Excel file is empty or invalid');
      }

      const tasksToCreate = data.map(({ title, content }) => {
        if (!title || !content) {
          throw new BadRequestException(
            'Excel file must have title and content columns',
          );
        }
        return {
          title: String(title),
          content: String(content),
          user: userId,
        };
      });

      const createdTasks = await this.taskModel.insertMany(tasksToCreate);

      return createdTasks;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
