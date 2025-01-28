import { Entity as OrmEntity, Index, PrimaryColumn, Column } from 'typeorm';
import { IEntity } from './interfaces';

export const ENTITY_REPOSITORY_SYMBOL = Symbol('EntityRepository');

@OrmEntity()
export class Entity implements IEntity {
  @PrimaryColumn({ type: 'character varying', name: 'external_id', length: 68 })
  public externalId!: string;

  @Index()
  @Column({
    type: 'bigint',
    name: 'osm_id',
    transformer: {
      to: (value: number) => value,
      from: (value: number) => parseInt(value.toString()),
    },
  })
  public osmId!: number;
}
