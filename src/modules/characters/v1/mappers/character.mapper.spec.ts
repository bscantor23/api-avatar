import { CharacterMapper } from './character.mapper';
import { SkillType, CharacterType } from '../../../../constants';

// Mock SkillsMapper and RelationsMapper used by CharacterMapper
jest.mock('../../../skills/v1/mappers', () => ({
  SkillsMapper: {
    mapList: (skills: any[], _host: string) => skills.map((s) => `${s.name}_mapped`),
  },
}));

jest.mock('./relations.mapper', () => ({
  RelationsMapper: {
    mapList: (relations: any[], type: number) =>
      type === CharacterType.ALLY ? ['ally_mapped'] : ['enemy_mapped'],
  },
}));

describe('CharacterMapper', () => {
  const host = 'http://host';

  const sampleCharacter = {
    id: 'c1',
    name: 'Name1',
    description: 'A character',
    image_url: 'img.png',
    source_url: 'src.png',
    character_skills: [
      { skill: { type_id: SkillType.BENDING, name: 'Bend1' } },
      { skill: { type_id: SkillType.OTHER, name: 'Other1' } },
      { skill: { type_id: SkillType.BENDING, name: 'Bend2' } },
    ],
    relations: [
      { relation_type_id: CharacterType.ALLY },
      { relation_type_id: CharacterType.ENEMY },
    ],
  } as any;

  it('maps character fields, skills, relations and builds url', () => {
    const mapped = CharacterMapper.map(sampleCharacter, host as any);

    expect(mapped.id).toBe('c1');
    expect(mapped.name).toBe('Name1');
    expect(mapped.description).toBe('A character');
    expect(mapped.imageUrl).toBe('img.png');
    expect(mapped.sourceUrl).toBe('src.png');
    expect(mapped.url).toBe(`${host}/characters/c1`);

    // SkillsMapper mock appends _mapped to skill names
    expect(mapped.skills.bending).toEqual(['Bend1_mapped', 'Bend2_mapped']);
    expect(mapped.skills.other).toEqual(['Other1_mapped']);

    // RelationsMapper mock returns ally_mapped / enemy_mapped
    expect(mapped.allies).toEqual(['ally_mapped']);
    expect(mapped.enemies).toEqual(['enemy_mapped']);
  });

  it('mapList maps multiple characters', () => {
    const list = [
      sampleCharacter,
      { ...sampleCharacter, id: 'c2', name: 'Name2' } as any,
    ];
    const mappedList = CharacterMapper.mapList(list, host as any);
    expect(mappedList).toHaveLength(2);
    expect(mappedList[0].id).toBe('c1');
    expect(mappedList[1].id).toBe('c2');
  });
});
