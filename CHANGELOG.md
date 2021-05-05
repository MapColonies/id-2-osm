# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
