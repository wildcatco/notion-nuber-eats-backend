import { BaseOutput } from './dtos/base-output.dto';

export const successResponse = <T>(
  data?: Required<Omit<T, keyof BaseOutput>>,
) => ({
  ok: true,
  ...(data && data),
});

export const errorResponse = (errorMsg: string) => ({
  ok: false,
  error: errorMsg,
});
