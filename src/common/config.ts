import { type ConfigInstance, config } from '@map-colonies/config';
import { commonBoilerplateV1, type commonBoilerplateV1Type } from '@map-colonies/schemas';
import { DbConfig } from './interfaces';

// Choose here the type of the config instance and import this type from the entire application
type ConfigType = ConfigInstance<commonBoilerplateV1Type & { db?: DbConfig }>;

let configInstance: ConfigType | undefined;

/**
 * Initializes the configuration by fetching it from the server.
 * This should only be called from the instrumentation file.
 * @returns A Promise that resolves when the configuration is successfully initialized.
 */
async function initConfig(offlineMode?: boolean): Promise<void> {
  configInstance = await config({
    schema: commonBoilerplateV1,
    offlineMode: offlineMode,
  });
}

function getConfig(): ConfigType {
  if (!configInstance) {
    throw new Error('config not initialized');
  }
  return configInstance;
}

export { getConfig, initConfig, ConfigType };
