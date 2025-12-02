import { RelationsMapper } from './relations.mapper';
import { CharacterType } from '../../../../constants';

describe('RelationsMapper', () => {
  describe('map', () => {
    it('returns related.name when relation.related is present', () => {
      const relation = {
        related: { name: 'RelatedName' },
        character: { name: 'CharacterName' },
      };

      expect(RelationsMapper.map(relation)).toBe('RelatedName');
    });

    it('returns character.name when relation.related is absent', () => {
      const relation = {
        related: null,
        character: { name: 'CharacterOnly' },
      };

      expect(RelationsMapper.map(relation)).toBe('CharacterOnly');
    });
  });

  describe('mapList', () => {
    it('filters by relation_type_id and maps names using related when available', () => {
      const relations = [
        {
          relation_type_id: CharacterType.ENEMY,
          related: { name: 'E1' },
          character: { name: 'C1' },
        },
        {
          relation_type_id: CharacterType.ALLY,
          related: { name: 'A1' },
          character: { name: 'C2' },
        },
        {
          relation_type_id: CharacterType.ENEMY,
          related: null,
          character: { name: 'E2' },
        },
      ];

      const mapped = RelationsMapper.mapList(relations, CharacterType.ENEMY);
      expect(mapped).toEqual(['E1', 'E2']);
    });

    it('returns empty array when no relations match the type', () => {
      const relations = [
        {
          relation_type_id: CharacterType.ALLY,
          related: { name: 'A1' },
          character: { name: 'C1' },
        },
      ];

      const mapped = RelationsMapper.mapList(relations, CharacterType.ENEMY);
      expect(mapped).toEqual([]);
    });
  });
});
