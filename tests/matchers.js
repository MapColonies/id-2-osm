expect.extend({
  toHavePropertyThatContains: (object, property, value) => {
    if (object !== undefined && object[property] !== undefined && object[property].includes(value)) {
      return { pass: true };
    }
    return {
      message: () => `expected ${object}.${property} to contain ${value}`,
      pass: false,
    };
  },
});
