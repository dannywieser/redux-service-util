import 'whatwg-fetch';

export interface IProcessedResponse {
  ok: boolean;
  data?: any;
  status?: number;
}
export interface IFetchOptions {
  method: string;
  body?: BodyInit;
  headers?: HeadersInit;
}

export const header = (contentType: string) => ({ 'Content-type': contentType });
export const jsonHeader = () => header('application/json; charset=UTF-8');

export const parseJSON = (text: string) => {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    // body content not json data, ignore it (status will be used)
    // TODO: handle raw string with error message?
  }
  return data;
};

export const process = async (response: Response): Promise<IProcessedResponse> => {
  const data = parseJSON(await response.text());
  const { ok } = response;
  const processedResponse = { ok, data, status: response.status };
  return response.ok ? processedResponse : Promise.reject(processedResponse);
};

export const build = (method: string, body?: BodyInit, headers?: HeadersInit): IFetchOptions => ({ method, body, headers });

export const invokeFetch = async (path: string, options?: IFetchOptions): Promise<IProcessedResponse> => {
  let result;
  try {
    result = await process(await fetch(path, options));
  } catch (errResult) {
    // catch undefined status and set to 0
    const { status = 0 } = errResult;
    console.error('error: ', errResult);
    result = { ...errResult, status };
  }
  return result;
};
export const doFetch = async (path: string) => invokeFetch(path);
export const doDelete = async (path: string) => invokeFetch(path, build('DELETE'));
export const doPost = async (path: string, body: string) => invokeFetch(path, build('POST', body, jsonHeader()));
export const doPatch = async (path: string, body: string) => invokeFetch(path, build('PATCH', body, jsonHeader()));
