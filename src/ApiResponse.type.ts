export type TApiResponse<T> = {status: 200; message: null; data: T | null} & {
  status: number;
  message: string | null;
  data: T | null;
};
