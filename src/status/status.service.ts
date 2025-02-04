import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './status.entity';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Status)
    private statusRepository: Repository<Status>,
  ) {}

  // =====================================================
  // OBTENER TODOS LOS USUARIOS
  // =====================================================
  async getStatus() {
    try {
      const status = await this.statusRepository.find();

      return status?.map((data) => ({
        description: data?.description,
        code: data?.statusCode,
        color: data?.color,
      }));
    } catch (error) {
      throw {
        errors: ['Ha ocurrido un error inesperado, inténtelo mas tarde.'],
      };
    }
  }
}
