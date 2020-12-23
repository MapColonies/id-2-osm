import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1608727901644 implements MigrationInterface {
    name = 'InitialMigration1608727901644'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "entity" ("external_id" character varying NOT NULL, "osm_id" bigint NOT NULL, CONSTRAINT "PK_d1650d4e4a9be142c458e2186f7" PRIMARY KEY ("external_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0848b852fa22b3e23b9378f616" ON "entity" ("osm_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_0848b852fa22b3e23b9378f616"`);
        await queryRunner.query(`DROP TABLE "entity"`);
    }

}
