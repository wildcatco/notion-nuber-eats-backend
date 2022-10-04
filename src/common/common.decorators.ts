export function CatchError(errorMsg: string) {
  return function (target: any, key: string, desc: PropertyDescriptor) {
    const origin = desc.value;
    desc.value = async function (...args: any[]) {
      try {
        const result = await origin.apply(this, args);
        return result;
      } catch (error) {
        return {
          ok: false,
          error: errorMsg,
        };
      }
    };
  };
}
