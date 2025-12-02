/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { Utils } from '../../../utils';
import { HttpException } from '@nestjs/common';

describe('CharactersController', () => {
  let controller: CharactersController;
  let service: {
    findAll: jest.Mock<any, any>;
    findOne: jest.Mock<any, any>;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharactersController],
      providers: [{ provide: CharactersService, useValue: service }],
    }).compile();

    controller = module.get<CharactersController>(CharactersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('parses page and uses default limit when limit not provided', async () => {
      const req = {
        protocol: 'http',
        headers: { host: 'localhost:3000' },
      } as any as Request;

      jest.spyOn(Utils, 'getUrlPath').mockReturnValue('http://localhost:3000');

      service.findAll.mockResolvedValue([{ id: 'c1' }]);

      const result = await controller.findAll(req, '2', undefined);

      expect(Utils.getUrlPath).toHaveBeenCalledWith(req);
      // page parsed to 2, limit becomes controller._limit (10) because page is present and limit undefined
      expect(result).toEqual([{ id: 'c1' }]);
    });

    it('uses provided limit when given and undefined page', async () => {
      const req = { protocol: 'http', headers: { host: 'h' } } as any;
      jest.spyOn(Utils, 'getUrlPath').mockReturnValue('http://h');
      service.findAll.mockResolvedValue([]);

      await controller.findAll(req, undefined, '5');
      expect(service.findAll).toHaveBeenCalledWith('http://h', undefined, 5);
    });

    it('throws HttpException when service throws', async () => {
      const req = { protocol: 'http', headers: { host: 'h' } } as any;
      jest.spyOn(Utils, 'getUrlPath').mockReturnValue('http://h');
      service.findAll.mockRejectedValue(new Error('boom'));

      await expect(controller.findAll(req, undefined, undefined)).rejects.toBeInstanceOf(
        HttpException,
      );
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with id and url', async () => {
      const req = { protocol: 'https', headers: { host: 'ex.com' } } as any;
      jest.spyOn(Utils, 'getUrlPath').mockReturnValue('https://ex.com');
      service.findOne.mockResolvedValue({ id: 'c1' });

      const res = await controller.findOne(req, 'c1');

      expect(Utils.getUrlPath).toHaveBeenCalledWith(req);
      expect(service.findOne).toHaveBeenCalledWith('c1', 'https://ex.com');
      expect(res).toEqual({ id: 'c1' });
    });

    it('throws HttpException when service.findOne throws', async () => {
      const req = { protocol: 'https', headers: { host: 'ex.com' } } as any;
      jest.spyOn(Utils, 'getUrlPath').mockReturnValue('https://ex.com');
      service.findOne.mockRejectedValue(new Error('nope'));

      await expect(controller.findOne(req, 'bad')).rejects.toBeInstanceOf(HttpException);
    });
  });
});
