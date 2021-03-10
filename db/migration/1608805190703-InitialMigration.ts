import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1608805190703 implements MigrationInterface {
    name = 'InitialMigration1608805190703'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "id-2-osm"."entity" ("external_id" character varying(68) NOT NULL, "osm_id" bigint NOT NULL, CONSTRAINT "PK_d1650d4e4a9be142c458e2186f7" PRIMARY KEY ("external_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0848b852fa22b3e23b9378f616" ON "id-2-osm"."entity" ("osm_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "id-2-osm"."IDX_0848b852fa22b3e23b9378f616"`);
        await queryRunner.query(`DROP TABLE "id-2-osm"."entity"`);
    }

}
