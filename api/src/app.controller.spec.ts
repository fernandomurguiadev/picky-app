import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: {
            isInitialized: true,
            query: jest.fn().mockResolvedValue([{ 1: 1 }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API status object', () => {
      const result = appController.getHello();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('message');
    });
  });

  describe('health', () => {
    it('should return healthy status', async () => {
      const result = await appController.checkHealth();
      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('database', 'up');
    });
  });
});
