import { CoreOutput } from './dtos/core-output.dto';

export const successResponse = <T>(data?: Omit<T, keyof CoreOutput>) => ({
  ok: true,
  ...(data && data),
});

export const errorResponse = (errorMsg: string) => ({
  ok: false,
  error: errorMsg,
});
