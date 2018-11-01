import * as httpUtils from '../http';

let fetchSpy: jest.Mock;
let jsonSpy: jest.Mock;
let textSpy: jest.Mock;

(<any> console).error = jest.fn();

function setupFetchSpy(expectedUrl: string, responseBody: Object, ok: boolean, status = 200) {
  fetchSpy.mockImplementationOnce((url: string) => {
    if (url === expectedUrl) {
      jsonSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
      textSpy.mockImplementationOnce(() => Promise.resolve(responseBody));
      return Promise.resolve({ ok, status, json: jsonSpy, text: textSpy });
    }
    throw new Error('unexpected url');
  });
}

beforeEach(() => {
  fetchSpy = jest.fn();
  jsonSpy = jest.fn();
  textSpy = jest.fn();
  window.fetch = fetchSpy;
});

test('doFetch should fetch the URL and return the response json', async () => {
  const expectedResponseJson = '{ "foo": "bar" }';
  setupFetchSpy('/theapi', expectedResponseJson, true);

  const result = await httpUtils.doFetch('/theapi');
  const expected = { status: 200, data: JSON.parse(expectedResponseJson), ok: true };
  expect(result).toEqual(expected);
});

test('doPost should post the provided body to the correct url', async () => {
  const expectedResponseJson = '{ "foo": "bar" }';
  setupFetchSpy('/theapi', expectedResponseJson, true);
  const body = '{ key: "value" }';
  const expectedFetchOptions = {
    body,
    method: 'POST',
    headers: httpUtils.jsonHeader(),
  };

  const result = await httpUtils.doPost('/theapi', body);
  const expected = { status: 200, data: JSON.parse(expectedResponseJson), ok: true };
  expect(result).toEqual(expected);
  expect(fetchSpy.mock.calls[0][1]).toEqual(expectedFetchOptions);
});

test('doPatch should PATCH the provided body to the correct url', async () => {
  const expectedResponseJson = '{ "foo": "bar" }';
  setupFetchSpy('/theapi', expectedResponseJson, true);
  const body = '{ key: "value" }';
  const expectedFetchOptions = {
    body,
    method: 'PATCH',
    headers: httpUtils.jsonHeader(),
  };

  const result = await httpUtils.doPatch('/theapi', body);
  const expected = { status: 200, data: JSON.parse(expectedResponseJson), ok: true };
  expect(result).toEqual(expected);
  expect(fetchSpy.mock.calls[0][1]).toEqual(expectedFetchOptions);
});

test('doDelete should DELETE the provided body to the correct url', async () => {
  const expectedResponseJson = '{ "foo": "bar" }';
  setupFetchSpy('/theapi/1', expectedResponseJson, true);
  const expectedFetchOptions = { method: 'DELETE' };
  const result = await httpUtils.doDelete('/theapi/1');
  const expected = { status: 200, data: JSON.parse(expectedResponseJson), ok: true };
  expect(result).toEqual(expected);
  expect(fetchSpy.mock.calls[0][1]).toEqual(expectedFetchOptions);
});

describe('response error handling', () => {
  test('should return an error with only status code if the body is empty', async () => {
    setupFetchSpy('/theapi', undefined, false, 401);
    const expected = { status: 401, ok: false, data: undefined as any };
    try {
      await httpUtils.doFetch('/theapi');
    } catch (err) {
      expect(err).toEqual(expected);
    }
  });

  test('should return an error with status code and data (body), if body is present', async () => {
    const responseBody = '{ "errorKey": "anErrorKeyValue" }';
    const expected = { status: 401, ok: false, data: JSON.parse(responseBody) };
    setupFetchSpy('/theapi', responseBody, false, 401);
    try {
      await httpUtils.doFetch('/theapi');
    } catch (err) {
      expect(err).toEqual(expected);
    }
  });

  test('should return a status code of 0 if the status code is undefined', async () => {
    const responseBody = '{ "errorKey": "anErrorKeyValue" }';
    const expected = { status: 0, ok: false, data: JSON.parse(responseBody) };
    // use incorrect url to trigger throw
    setupFetchSpy('/theapi1', responseBody, false, undefined);
    try {
      await httpUtils.doFetch('/theapi');
    } catch (err) {
      expect(err).toEqual(expected);
    }
  });
});
