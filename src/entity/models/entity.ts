import {Entity as OrmEntity, Index,  PrimaryColumn, Column} from "typeorm"

export interface IEntity {
  externalId: string;
  osmId: number;
}

@OrmEntity()
export class Entity implements IEntity {
  
  @PrimaryColumn({name: 'external_id'})
  public externalId!: string;

  @Index({unique: true})
  @Column({ type: 'bigint', name: 'osm_id'})
  public osmId!: number;
}