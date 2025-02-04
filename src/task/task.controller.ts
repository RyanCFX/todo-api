import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { format, formatErrors } from 'src/utils/helpers';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AddTaskDto, ChangeTaskStatusDto } from './task.dto';
import { TodoGateway } from './task.socket';

@Controller('task')
export class TaskController {
  constructor(private taskService: TaskService, private taskGateway: TodoGateway) { }

  @Get(':groupId')
  @UseGuards(JwtAuthGuard)
  async getTasks(@Param('groupId') groupId: string, @Res() res: Response) {
    try {
      const response = await this.taskService.getTasks(groupId);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Get('byId/:taskId')
  @UseGuards(JwtAuthGuard)
  async getTaskById(
    @Param('taskId') taskId: string,
    @Res() res: Response,
  ) {
    try {
      const response = await this.taskService.getTaskById(taskId);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Post()
  @UseGuards(AdminGuard)
  async addTask(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: AddTaskDto,
  ) {
    try {
      const dto = plainToClass(AddTaskDto, body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      const response = await this.taskService.addTask(
        body,
        format.transactionData(req),
      );

      this.taskGateway.server.to(body.groupId).emit('NEW_TASK', response);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Put('status')
  @UseGuards(AdminGuard)
  async changeStatus(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: ChangeTaskStatusDto,
  ) {
    try {
      const dto = plainToClass(ChangeTaskStatusDto, body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      const response = await this.taskService.changeStatus(
        body,
        format.transactionData(req),
      );

      this.taskGateway.server.to(response.group.groupId).emit('NEW_TASK_STATUS', response);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Put('update/:taskId')
  @UseGuards(AdminGuard)
  async updateTask(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: AddTaskDto,
    @Param('taskId') taskId: string,
  ) {
    try {
      const dto = plainToClass(AddTaskDto, body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      const response = await this.taskService.updateTask(
        taskId,
        body,
        format.transactionData(req),
      );

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Delete()
  @UseGuards(AdminGuard )
  async removeTask(
    @Req() req: Request,
    @Res() res: Response,
    @Body('taskId') taskId: string,
  ) {
    try {
      const response = await this.taskService.removeTask(
        taskId,
        format.transactionData(req),
      );

      this.taskGateway.server.to(response.group.groupId).emit('DELETED_TASK', response);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }
}
