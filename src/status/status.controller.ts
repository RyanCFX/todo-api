import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { StatusService } from './status.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('status')
export class StatusController {
  constructor(private statuservice: StatusService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getStatus(@Res() res: Response) {
    try {
      const response = await this.statuservice.getStatus();

      res.status(200).json(response);
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }
}
