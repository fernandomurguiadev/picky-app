import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  getHello() {
    return {
      status: 'ok',
      message: '¡Picky API está funcionando de mil maravillas! 🚀',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async checkHealth() {
    let dbStatus = 'down';
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        dbStatus = 'up';
      }
    } catch (error) {
      dbStatus = `down: ${(error as Error).message}`;
    }

    return {
      status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
