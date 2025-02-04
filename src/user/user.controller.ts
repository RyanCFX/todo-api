import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { AddUserDto, EditUserDto, GetUsersDto } from './user.dto';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { format, formatErrors } from 'src/utils/helpers';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: GetUsersDto,
  ) {
    try {
      const response = await this.userService.getUsers(query);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Get('byId/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('userId') userId: string, @Res() res: Response) {
    try {
      const response = await this.userService.getUserById(userId);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Get('byMail/:email')
  @UseGuards(JwtAuthGuard)
  async getUserByEmail(@Param('email') email: string, @Res() res: Response) {
    try {
      console.log('PRUEBA');

      const response = await this.userService.getUserByMail(email);

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Post()
  @UseGuards(AdminGuard)
  async addUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: AddUserDto,
    @Headers('user-agent') userAgent: string,
  ) {
    try {
      const dto = plainToClass(AddUserDto, body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      const response = await this.userService.addUser(body, {
        user: req.cookies.user,
        userAgent,
        ip: format.ip(req.ip),
      });

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Put('/:userId')
  @UseGuards(AdminGuard)
  async editUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: EditUserDto,
    @Param('userId') userId: string,
  ) {
    try {
      const dto = plainToClass(EditUserDto, body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      const response = await this.userService.editUser(
        userId,
        body,
        format.transactionData(req),
      );

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }
}
