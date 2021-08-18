# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/MapColonies/id-2-osm/compare/v1.5.1...v2.0.0) (2021-08-18)


### ⚠ BREAKING CHANGES

* **entity:** one endpoint for entity bulk creation and deletion (#90)

### Features

* **entity:** one endpoint for entity bulk creation and deletion ([#90](https://github.com/MapColonies/id-2-osm/issues/90)) ([db6dca5](https://github.com/MapColonies/id-2-osm/commit/db6dca527fd699a9ea70070f5c4269fa44c3c556))

### [1.5.1](https://github.com/MapColonies/id-2-osm/compare/v1.5.0...v1.5.1) (2021-08-04)

## [1.5.0](https://github.com/MapColonies/id-2-osm/compare/v1.4.1...v1.5.0) (2021-07-08)

### [1.4.1](https://github.com/MapColonies/id-2-osm/compare/v1.4.0...v1.4.1) (2021-07-06)

## [1.4.0](https://github.com/MapColonies/id-2-osm/compare/v1.3.1...v1.4.0) (2021-07-01)


### Features

* added traceparent header on response ([#73](https://github.com/MapColonies/id-2-osm/issues/73)) ([0516521](https://github.com/MapColonies/id-2-osm/commit/05165214d3d99df72fa466821d3a1553ab1d89a3))

### [1.3.1](https://github.com/MapColonies/id-2-osm/compare/v1.3.0...v1.3.1) (2021-05-25)


### Bug Fixes

* fixed image of migrations to include python for node-gyp ([4c34e66](https://github.com/MapColonies/id-2-osm/commit/4c34e66956aacf9396eddea5d46dbfbd1ce84ffe))

## [1.3.0](https://github.com/MapColonies/id-2-osm/compare/v1.2.0...v1.3.0) (2021-05-25)


### Features

* **configurations:** added otel support of tracing and metrics ([#56](https://github.com/MapColonies/id-2-osm/issues/56)) ([1135142](https://github.com/MapColonies/id-2-osm/commit/11351427981108b00dbf5e211a4a03741936a0fc))


### Bug Fixes

* **configurations:** standard-version now bumps both files ([498a91c](https://github.com/MapColonies/id-2-osm/commit/498a91cf547a76832c3120b22d54f5ec7b84eb6c))
* **configurations:** updated image to Dockerfile to reduce vulnerabilities ([#57](https://github.com/MapColonies/id-2-osm/issues/57)) ([f7e9bf5](https://github.com/MapColonies/id-2-osm/commit/f7e9bf54524b8c7150ee7f7ba404778d531a0bc8))

## [1.2.0](https://github.com/MapColonies/id-2-osm/compare/v1.1.1...v1.2.0) (2021-05-05)


### Features

* **configurations:** added lint for openapi3.yml ([a729b19](https://github.com/MapColonies/id-2-osm/commit/a729b19f0e4ad09fe39fbe8f14656bc9c1a2b507))

### [1.1.1](https://github.com/MapColonies/id-2-osm/compare/v1.1.0...v1.1.1) (2021-05-05)


### Bug Fixes

* **configurations:** removed servers list from openapi3.yml ([99ce1d6](https://github.com/MapColonies/id-2-osm/commit/99ce1d6b245572f2a28085461d11d76ca42f1ded))

## [1.1.0](https://github.com/MapColonies/id-2-osm/compare/v1.0.0...v1.1.0) (2021-05-03)


### Features

* **configurations:** add support for choosing the schema for the DB ([#35](https://github.com/MapColonies/id-2-osm/issues/35)) ([f8812c6](https://github.com/MapColonies/id-2-osm/commit/f8812c67235a7a9c5a54597503a6cc04f93c1f49)), closes [#34](https://github.com/MapColonies/id-2-osm/issues/34)
* **configurations:** added option for cert auth to db ([#42](https://github.com/MapColonies/id-2-osm/issues/42)) ([f71f850](https://github.com/MapColonies/id-2-osm/commit/f71f8500773f79ba91d70702b04d166639f186e3))
* **configurations:** enabled cert auth on migrations ([#43](https://github.com/MapColonies/id-2-osm/issues/43)) ([da6dc05](https://github.com/MapColonies/id-2-osm/commit/da6dc051d284cab1ffeac8a567f28eb5b27167bb))
* server payload size is configurable via config file ([fa55ad8](https://github.com/MapColonies/id-2-osm/commit/fa55ad87f3bfb149035f3d003c614560dd624e4b))
* **entity:** add bulk delete of id mappings ([#17](https://github.com/MapColonies/id-2-osm/issues/17)) ([826c772](https://github.com/MapColonies/id-2-osm/commit/826c772a9c49b035d6fb120e849e7bdc058827d5)), closes [#16](https://github.com/MapColonies/id-2-osm/issues/16)
* **entity:** add bulk insert of id mappings ([#15](https://github.com/MapColonies/id-2-osm/issues/15)) ([353408d](https://github.com/MapColonies/id-2-osm/commit/353408d49cb23e35f0f3ef16eab28c62c4a39147)), closes [#14](https://github.com/MapColonies/id-2-osm/issues/14)
* **entity:** get /entity return only osmId with text/plain header ([#22](https://github.com/MapColonies/id-2-osm/issues/22)) ([b4b2baf](https://github.com/MapColonies/id-2-osm/commit/b4b2bafbe90c76da13b512306cc3305ed15a0394))

## 1.0.0 (2020-12-29)


### Features

* **entity:** added post /entity ([#9](https://github.com/MapColonies/id-2-osm/issues/9)) ([f4ef36b](https://github.com/MapColonies/id-2-osm/commit/f4ef36b209a845cc88214978c60de8cd679ddd0f))
* **entity:** delete /entity/:externalId ([#11](https://github.com/MapColonies/id-2-osm/issues/11)) ([eeee743](https://github.com/MapColonies/id-2-osm/commit/eeee7437ddcd547ec1a4262931ba6bb2730d7662))
* **entity:** GET /entity/externalId ([#10](https://github.com/MapColonies/id-2-osm/issues/10)) ([a8b9537](https://github.com/MapColonies/id-2-osm/commit/a8b9537b7cb6b77a562dc5af301e1c4158ea3136))
