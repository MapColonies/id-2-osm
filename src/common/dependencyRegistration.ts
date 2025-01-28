import { ClassProvider, container as defaultContainer, FactoryProvider, InjectionToken, ValueProvider, RegistrationOptions } from 'tsyringe';
import { constructor, DependencyContainer } from 'tsyringe/dist/typings/types';

export type Providers<T> = ValueProvider<T> | FactoryProvider<T> | ClassProvider<T> | constructor<T>;

export interface InjectionObject<T> {
  token: InjectionToken<T>;
  provider: Providers<T>;
  options?: RegistrationOptions;
  postInjectionHook?: (container: DependencyContainer) => void | Promise<void>;
}

export const registerDependencies = async (
  dependencies: InjectionObject<unknown>[],
  override?: InjectionObject<unknown>[],
  useChild = false
): Promise<DependencyContainer> => {
  const container = useChild ? defaultContainer.createChildContainer() : defaultContainer;
  for (const dep of dependencies) {
    const injectionObj = override?.find((overrideObj) => overrideObj.token === dep.token) ?? dep;
    container.register(injectionObj.token, injectionObj.provider as constructor<unknown>, injectionObj.options);
    await dep.postInjectionHook?.(container);
  }

  return container;
};
