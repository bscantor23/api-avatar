/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { CharactersService } from './characters.service';
import { PrismaService } from '../../../modules/prisma/prisma.service';
import { CharacterMapper } from './mappers';
import { Utils } from '../../../utils';

describe('CharactersService', () => {
  let service: CharactersService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      $transaction: jest.fn(),
      characters: {
        findUnique: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns info and mapped data using CharacterMapper.mapList', async () => {
      const characters = [
        {
          id: 'c1',
          character_relateds: [],
          relateds_character: [],
          character_skills: [],
        },
      ];
      const total = 123;

      prismaMock.characters.findMany = jest.fn().mockResolvedValue(characters);
      prismaMock.skills = { count: jest.fn().mockResolvedValue(total) } as any;
      prismaMock.$Transaction = prismaMock.$transaction;
      prismaMock.$transaction.mockResolvedValue([characters, total]);

      jest.spyOn(CharacterMapper, 'mapList').mockReturnValue([{ id: 'mapped1' } as any]);
      jest.spyOn(Utils, 'getPageConfig').mockReturnValue({ page: 'cfg' } as any);

      const res = await service.findAll('http://h', 1, 10);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(CharacterMapper.mapList).toHaveBeenCalled();
      expect(Utils.getPageConfig).toHaveBeenCalledWith(1, 10, total);
      expect(res.info.total).toBe(total);
      expect(res.data).toEqual([{ id: 'mapped1' }]);
    });
  });

  describe('findOne', () => {
    it('returns mapped character using CharacterMapper.map', async () => {
      const character = {
        id: 'c1',
        character_relateds: [],
        relateds_character: [],
        character_skills: [],
      } as any;

      prismaMock.characters.findUnique.mockResolvedValue(character);

      jest.spyOn(CharacterMapper, 'map').mockReturnValue({ id: 'mapped' } as any);

      const res = await service.findOne('c1', 'http://h');

      expect(prismaMock.characters.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'c1' } }),
      );
      expect(CharacterMapper.map).toHaveBeenCalled();
      expect(res).toEqual({ data: { id: 'mapped' } });
    });
  });
});
