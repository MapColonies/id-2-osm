declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePropertyThatContains: (property: string, value: string) => CustomMatcherResult;
    }
  }
}

export {};
