import { Entity as OrmEntity, Index, PrimaryColumn, Column } from 'typeorm';

export interface IEntity {
  externalId: string;
  osmId: number;
}

@OrmEntity()
export class Entity implements IEntity {
  @PrimaryColumn({ type: 'varchar', name: 'external_id', length: 68 })
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
