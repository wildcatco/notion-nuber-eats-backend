export const successResponse = <T>(data?: Omit<T, 'ok' | 'error'>) => ({
  ok: true,
  ...(data && data),
});

export const errorResponse = (errorMsg: string) => ({
  ok: false,
  error: errorMsg,
});
