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
import { GroupService } from './group.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { format, formatErrors } from 'src/utils/helpers';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AddGroupDto, AddUserGroupDto } from './group.dto';

@Controller('group')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getGroups(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.groupService.getGroups(
        format.transactionData(req),
      );

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Get(':groupId')
  @UseGuards(JwtAuthGuard)
  async getGroupById(@Param('groupId') groupId: string, @Res() res: Response) {
    try {
      const response = await this.groupService.getGroupById(groupId);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Post()
  @UseGuards(AdminGuard)
  async addGroup(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: AddGroupDto,
  ) {
    try {
      const dto = plainToClass(AddGroupDto, body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      const response = await this.groupService.addGroup(
        body,
        format.transactionData(req),
      );

      res.status(200).json(response);
    } catch (error) {
      console.log(error);

      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Post('join')
  @UseGuards(AdminGuard)
  async addUserGroup(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: AddUserGroupDto,
  ) {
    try {
      const dto = plainToClass(AddUserGroupDto, body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      const response = await this.groupService.addUserGroup(
        body,
        format.transactionData(req),
      );

      res.status(200).json(response);
    } catch (error) {
      console.log(error);

      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Delete()
  @UseGuards(AdminGuard)
  async removeGroup(
    @Req() req: Request,
    @Res() res: Response,
    @Query('groupId') groupId: string,
  ) {
    try {
      const response = await this.groupService.removeGroup(
        groupId,
        format.transactionData(req),
      );

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }
}
