export interface IResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp?: string;
  path?: string;
  data?: T;
  meta?: any;
}

/**
 * Authenticated user interface
 */
export interface IAuthUser {
  externalId: string;
  tenantExternalId: string;
  email: string;
  role: string;
}

export const successRequestResponse = (
  message: string,
  data?: IResponse['data'],
  statusCode = 200,
): IResponse => {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
};