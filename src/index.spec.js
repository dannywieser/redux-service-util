import * as utils from './index';

const data = { a: '1', b: '2', c: '3' };
const error = { code: 'errorCode' };

describe('Helper Functions', () => {
  test('typePending(): build an action string for a pending action', () => {
    expect(utils.typePending('actionname')).toBe('actionname.pending');
  });

  test('typeOK(): build an action string for a ok action', () => {
    expect(utils.typeOK('actionname')).toBe('actionname.ok');
  });

  test('typeFail(): build an action string for a fail action', () => {
    expect(utils.typeFail('actionname')).toBe('actionname.fail');
  });

  test('Payload(): wrap a provided object as an action payload', () => {
    expect(utils.Payload(data)).toEqual({ payload: { ...data } });
  });
});

describe('Action Builders', () => {
  test('ActionSync(): create an non-async action given a type and payload', () => {
    const type = 'non-async-action';
    expect(utils.ActionSync(type, data)).toEqual({ type, payload: { ...data } });
  });

  test('ActionPending(): create an pending action given a type and payload', () => {
    expect(utils.ActionPending('action', data)).toEqual({
      type: 'action.pending',
      payload: { ...data },
    });
  });

  test('ActionOK(): create an ok action given a type and payload', () => {
    expect(utils.ActionOK('action', data)).toEqual({
      type: 'action.ok',
      payload: { ...data },
    });
  });

  test('ActionFail(): create a failed action given a type and payload', () => {
    expect(utils.ActionFail('action', error)).toEqual({
      type: 'action.fail',
      payload: { error: { ...error } },
    });
  });

  describe('ActionAsync()', () => {
    let handler;
    let dispatchSpy;
    let asyncAction;
    beforeEach(() => {
      handler = jest.fn();
      dispatchSpy = jest.fn();
      asyncAction = utils.ActionAsync('action', handler, 'a', 'b', 'c');
    });

    test('will immediately dispatch a pending action', () => {
      asyncAction(dispatchSpy).catch(() => {});
      expect(dispatchSpy.mock.calls[0][0]).toEqual({ type: 'action.pending', payload: {} });
    });

    test('will invoke the handler with the provided parameters', () => {
      asyncAction(dispatchSpy).catch(() => {});
      expect(handler.mock.calls[0][0]).toEqual('a');
      expect(handler.mock.calls[0][1]).toEqual('b');
      expect(handler.mock.calls[0][2]).toEqual('c');
    });

    test('will dispatch an OK action on async success', async () => {
      handler.mockReturnValue(Promise.resolve({ ok: true, payload: data }));
      await asyncAction(dispatchSpy).catch(() => {});
      expect(dispatchSpy.mock.calls[1][0]).toEqual({ type: 'action.ok', payload: data });
    });

    test('will dispatch a FAIL action on async failure', async () => {
      handler.mockReturnValue(Promise.resolve({ ok: false, payload: data, error }));
      await asyncAction(dispatchSpy).catch(() => {});
      expect(dispatchSpy.mock.calls[1][0]).toEqual({ type: 'action.fail', payload: { error } });
    });
  });
});

describe('Reducer Helpers', () => {
  test('ReducerPending(): set isLoading to true, destructure payload', () => {
    const state = { a: '1' };
    const action = { type: 'action', payload: { b: '2' } };
    expect(utils.ReducerPending(state, action)).toEqual({
      a: '1',
      b: '2',
      errorDetail: null,
      isLoading: true,
      hasError: false,
    });
  });

  test('ReducerOK(): set isLoading to false, destructure payload', () => {
    const state = { a: '1', isLoading: true };
    const action = { type: 'action', payload: { b: '2' } };
    expect(utils.ReducerOK(state, action)).toEqual({
      a: '1',
      b: '2',
      errorDetail: null,
      isLoading: false,
      hasError: false,
    });
  });

  test('ReducerFail(): set isLoading to false, hasError to true, destructure payload', () => {
    const state = { a: '1', isLoading: true };
    const action = { type: 'action', payload: { error: 'errorDetails' } };
    expect(utils.ReducerFail(state, action)).toEqual({
      a: '1',
      errorDetail: 'errorDetails',
      isLoading: false,
      hasError: true,
    });
  });
});

describe('Reducer Handler Map', () => {
  let initialState;
  let action1;
  let action2;
  let reducerMap;
  beforeEach(() => {
    initialState = { initial: true };
    action1 = jest.fn();
    action2 = jest.fn();
    reducerMap = utils.createReducer(initialState, { action1, action2 });
  });

  test('invokes the correct handler based on action type', () => {
    const firstAction = { type: 'action1', payload: {} };
    reducerMap(initialState, firstAction);
    expect(action1.mock.calls).toHaveLength(1);
    expect(action2.mock.calls).toHaveLength(0);

    const secondAction = { type: 'action2', payload: {} };
    reducerMap(initialState, secondAction);
    expect(action2.mock.calls).toHaveLength(1);
  });

  test('returns the new state from the handler function', () => {
    const action = { type: 'action1', payload: {} };
    const newState = { new: 'value' };
    action1.mockReturnValue(newState);
    expect(reducerMap(initialState, action)).toEqual(newState);
  });

  test('passes the state and action correctly to the handler', () => {
    const action = { type: 'action1', payload: { foo: 'bar' } };
    reducerMap(initialState, action);
    expect(action1.mock.calls[0][0]).toEqual(initialState);
    expect(action1.mock.calls[0][1]).toEqual(action);
  });

  test('returns the initial state if no handler is mapped to action', () => {
    const action = { type: 'no-map-action', payload: { foo: 'bar' } };
    const result = reducerMap(initialState, action);
    expect(action1.mock.calls).toHaveLength(0);
    expect(action2.mock.calls).toHaveLength(0);
    expect(result).toEqual(initialState);
  });

  test('returns the initial state for an incorrectly defined action', () => {
    const action = { };
    const result = reducerMap(initialState, action);
    expect(action1.mock.calls).toHaveLength(0);
    expect(action2.mock.calls).toHaveLength(0);
    expect(result).toEqual(initialState);
  });

  test('returns the initial state if handler called with no params', () => {
    const result = reducerMap();
    expect(action1.mock.calls).toHaveLength(0);
    expect(action2.mock.calls).toHaveLength(0);
    expect(result).toEqual(initialState);
  });

  describe('ReducerAsync()', () => {
    let reducer;
    const state = { };
    beforeEach(() => {
      reducer = utils.createReducer(state, utils.ReducerAsync('action'));
    });

    test('properly maps the pending action to the ReducerPending handler', () => {
      const pendingAction = { type: 'action.pending', payload: data };
      expect(reducer(state, pendingAction)).toEqual({
        ...data,
        errorDetail: null,
        isLoading: true,
        hasError: false,
      });
    });

    test('properly maps the ok action to the ReducerOK handler', () => {
      const okAction = { type: 'action.ok', payload: data };
      expect(reducer(state, okAction)).toEqual({
        ...data,
        errorDetail: null,
        isLoading: false,
        hasError: false,
      });
    });

    test('properly maps the fail action to the ReducerFail handler', () => {
      const failAction = { type: 'action.fail', payload: { error: 'detail' } };
      expect(reducer(state, failAction)).toEqual({
        errorDetail: 'detail',
        isLoading: false,
        hasError: true,
      });
    });
  });

  describe('ReducerAsyncActions()', () => {
    const testActions = ['action1', 'action2', 'action3'];
    let reducer;
    const state = { };
    beforeEach(() => {
      reducer = utils.createReducer(state, utils.ReducerAsyncActions(testActions));
    });

    testActions.forEach((action) => {
      test(`properly maps the pending action to the ReducerPending handler: ${action}`, () => {
        const pendingAction = { type: `${action}.pending`, payload: data };
        expect(reducer(state, pendingAction)).toEqual({
          ...data,
          errorDetail: null,
          isLoading: true,
          hasError: false,
        });
      });
      test(`properly maps the ok action to the ReducerOK handler: ${action}`, () => {
        const okAction = { type: `${action}.ok`, payload: data };
        expect(reducer(state, okAction)).toEqual({
          ...data,
          errorDetail: null,
          isLoading: false,
          hasError: false,
        });
      });
      test(`properly maps the fail action to the ReducerFail handler: ${action}`, () => {
        const failAction = { type: `${action}.fail`, payload: { error: 'detail' } };
        expect(reducer(state, failAction)).toEqual({
          errorDetail: 'detail',
          isLoading: false,
          hasError: true,
        });
      });
    });
  });
});

describe('asyncInvoke()', () => {
  let asyncFuncSpy;
  beforeEach(() => {
    asyncFuncSpy = jest.fn();
  });

  test('should invoke the async func with the given params', () => {
    utils.asyncInvoke(asyncFuncSpy, 'a', 'b', 'c');
    expect(asyncFuncSpy.mock.calls).toHaveLength(1);
    expect(asyncFuncSpy.mock.calls[0][0]).toBe('a');
    expect(asyncFuncSpy.mock.calls[0][1]).toBe('b');
    expect(asyncFuncSpy.mock.calls[0][2]).toBe('c');
  });

  test('should return an OK response on success of the async function', async () => {
    asyncFuncSpy.mockReturnValue(Promise.resolve(data));
    const result = await utils.asyncInvoke(asyncFuncSpy, 'a', 'b', 'c');
    expect(result).toEqual({ ok: true, data });
  });

  test('should return a fail response on success of the async function', async () => {
    asyncFuncSpy.mockReturnValue(Promise.reject(error));
    const result = await utils.asyncInvoke(asyncFuncSpy, 'a', 'b', 'c');
    expect(result).toEqual({ ok: false, error });
  });
});
