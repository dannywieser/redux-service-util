import * as redux from '../redux';

const data = { a: '1', b: '2', c: '3' };

(<any> console).error = jest.fn();

describe('Helper Functions', () => {
  test('typePending(): build an action string for a pending action', () => {
    expect(redux.typePending('actionname')).toBe('actionname.pending');
  });

  test('typeOK(): build an action string for a ok action', () => {
    expect(redux.typeOK('actionname')).toBe('actionname.ok');
  });

  test('typeFail(): build an action string for a fail action', () => {
    expect(redux.typeFail('actionname')).toBe('actionname.fail');
  });
});

describe('Action Builders', () => {
  test('actionSync(): create an non-async action given a type and payload', () => {
    const type = 'non-async-action';
    expect(redux.actionSync(type, data)).toEqual({ type, payload: { ...data } });
  });

  test('actionPending(): create an pending action given a type and payload', () => {
    expect(redux.actionPending('action', data)).toEqual({
      type: 'action.pending',
      payload: { ...data },
    });
  });

  test('actionPending(): create an pending action given a type (no payload)', () => {
    expect(redux.actionPending('action')).toEqual({
      type: 'action.pending',
      payload: {},
    });
  });

  test('actionOK(): create an ok action given a type and payload', () => {
    expect(redux.actionOK('action', data)).toEqual({
      type: 'action.ok',
      payload: { ...data },
    });
  });

  test('actionFail(): create a failed action given a type and payload', () => {
    expect(redux.actionFail('action', { status: 401 })).toEqual({
      type: 'action.fail',
      payload: { status: 401 },
    });
  });

  describe('actionAsync()', () => {
    let handler: any;
    let dispatchSpy: jest.Mock;
    let asyncAction: any;
    beforeEach(() => {
      handler = jest.fn();
      dispatchSpy = jest.fn();
      const actionAsyncOptions = {
        handler,
        type: 'action',
      };
      asyncAction = redux.actionAsync(actionAsyncOptions, 'a', 'b', 'c');
    });

    test('will immediately dispatch a pending action', () => {
      const expectedPayload = {
        api: { updating: '' },
      };
      asyncAction(dispatchSpy).catch(() => {});
      expect(dispatchSpy.mock.calls[0][0]).toEqual({ type: 'action.pending', payload: expectedPayload });
    });

    test('will invoke the handler with the provided parameters', () => {
      asyncAction(dispatchSpy).catch(() => {
        // no action needed
      });
      expect(handler.mock.calls[0][0]).toEqual('a');
      expect(handler.mock.calls[0][1]).toEqual('b');
      expect(handler.mock.calls[0][2]).toEqual('c');
    });

    test('will dispatch an OK action on async success', async () => {
      const expectedPayload = {
        ...data,
        api: { updating: '' },
      };
      handler.mockReturnValue(Promise.resolve({ ok: true, payload: data }));
      await asyncAction(dispatchSpy).catch(() => {
        // no action needed
      });
      expect(dispatchSpy.mock.calls[1][0]).toEqual({ type: 'action.ok', payload: expectedPayload });
    });

    test('will dispatch a FAIL action on async failure', async () => {
      handler.mockReturnValue(Promise.resolve({ ok: false, payload: data }));
      await asyncAction(dispatchSpy).catch(() => {
        // no action needed
      });
      expect(dispatchSpy.mock.calls[1][0]).toEqual({ type: 'action.fail', payload: { ...data } });
    });
  });

  describe('ActionASync api options', () => {
    test('when passed an api option of updating, will pass this value in payload of pending/ok actions', async () => {
      const handler = jest.fn();
      const dispatchSpy = jest.fn();
      const optWithUpdating = {
        handler,
        type: 'action',
        updating: 'abc123',
      };
      const asyncAction = redux.actionAsync(optWithUpdating, 'a');
      const expectedPayload = {
        api: { updating: 'abc123' },
      };
      handler.mockReturnValue(Promise.resolve({ ok: true, payload: {} }));
      await asyncAction(dispatchSpy).catch(() => {
        // no action needed
      });
      expect(dispatchSpy.mock.calls[0][0]).toEqual({ type: 'action.pending', payload: expectedPayload });
      expect(dispatchSpy.mock.calls[1][0]).toEqual({ type: 'action.ok', payload: expectedPayload });
    });

    test('when passed an api option of fetched: true, will pass this value in payload of pending/ok actions', async () => {
      const handler = jest.fn();
      const dispatchSpy = jest.fn();
      const optWithFetch = {
        handler,
        type: 'action',
        fetched: true,
      };
      const asyncAction = redux.actionAsync(optWithFetch, 'a');
      const expectedPayload = {
        api: { fetched: true, updating: '' },
      };
      handler.mockReturnValue(Promise.resolve({ ok: true, payload: {} }));
      await asyncAction(dispatchSpy).catch(() => {
        // no action needed
      });
      expect(dispatchSpy.mock.calls[0][0]).toEqual({ type: 'action.pending', payload: expectedPayload });
      expect(dispatchSpy.mock.calls[1][0]).toEqual({ type: 'action.ok', payload: expectedPayload });
    });
  });
});

describe('Reducer Helpers', () => {
  test('reducerPending(): set pending to true, destructure payload', () => {
    const state = { a: '1', ...redux.INITIAL_ASYNC_STATE };
    const action = { type: 'action', payload: { b: '2' } };
    expect(redux.reducerPending(state, action)).toEqual({
      a: '1',
      b: '2',
      api: {
        pending: true,
        ok: true,
        error: null,
        fetched: false,
        updating: '',
      },
    });
  });

  test('reducerPending(): sets updating in api if passed in payload', () => {
    const state = { a: '1', ...redux.INITIAL_ASYNC_STATE };
    const action = { type: 'action', payload: { b: '2', api: { updating: 'new' } } };
    expect(redux.reducerPending(state, action)).toEqual({
      a: '1',
      b: '2',
      api: {
        pending: true,
        updating: 'new',
        fetched: false,
        ok: true,
        error: null,
      },
    });
  });

  test('reducerOK(): set pending to false, destructure payload', () => {
    const { api } = redux.INITIAL_ASYNC_STATE;
    const state = { a: '1', api: { ...api, pending: true, updating: 'someid' } };
    const action = { type: 'action', payload: { b: '2' } };
    expect(redux.reducerOK(state, action)).toEqual({
      a: '1',
      b: '2',
      api: {
        error: null,
        pending: false,
        ok: true,
        updating: '',
        fetched: false,
      },
    });
  });

  test('reducerPending(): sets fetched in api if passed in payload', () => {
    const state = { a: '1', ...redux.INITIAL_ASYNC_STATE };
    const action = { type: 'action', payload: { b: '2', api: { fetched: true } } };
    expect(redux.reducerOK(state, action)).toEqual({
      a: '1',
      b: '2',
      api: {
        ok: true,
        pending: false,
        updating: '',
        fetched: true,
        error: null,
      },
    });
  });

  test('reducerFail(): set pending to false, hasError to true, destructure payload', () => {
    const { api } = redux.INITIAL_ASYNC_STATE;
    const state = { a: '1', api: { ...api, pending: true, updating: 'someid' } };
    const action = { type: 'action', payload: { status: 500 } };
    expect(redux.reducerFail(state, action)).toEqual({
      a: '1',
      api: {
        error: { status: 500 },
        pending: false,
        ok: false,
        fetched: false,
        updating: '',
      },
    });
  });
});

describe('reducer Handler Map', () => {
  let initialState: redux.IBaseState;
  let action1: jest.Mock;
  let action2: jest.Mock;
  let reducerMap: any;
  beforeEach(() => {
    initialState = { ...redux.INITIAL_ASYNC_STATE };
    action1 = jest.fn();
    action2 = jest.fn();
    reducerMap = redux.createReducer(initialState, { action1, action2 });
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
    let reducer: Function;
    const state = { ...redux.INITIAL_ASYNC_STATE };
    beforeEach(() => {
      reducer = redux.createReducer(state, redux.reducerAsync('action'));
    });

    test('properly maps the pending action to the ReducerPending handler', () => {
      const pendingAction = { type: 'action.pending', payload: data };
      expect(reducer(state, pendingAction)).toEqual({
        ...data,
        api: {
          pending: true,
          updating: '',
          error: null,
          fetched: false,
          ok: true,
        },
      });
    });

    test('properly maps the ok action to the ReducerOK handler', () => {
      const okAction = { type: 'action.ok', payload: data };
      expect(reducer(state, okAction)).toEqual({
        ...data,
        api: {
          error: null,
          pending: false,
          ok: true,
          updating: '',
          fetched: false,
        },
      });
    });

    test('properly maps the fail action to the ReducerFail handler', () => {
      const failAction = { type: 'action.fail', payload: { status: 404 } };
      expect(reducer(state, failAction)).toEqual({
        api: {
          error: { status: 404 },
          pending: false,
          ok: false,
          updating: '',
          fetched: false,
        },
      });
    });
  });

  describe('reducerAsyncActions()', () => {
    const testActions = ['action1', 'action2', 'action3'];
    let reducer: Function;
    const state = { ...redux.INITIAL_ASYNC_STATE };
    beforeEach(() => {
      reducer = redux.createReducer(state, redux.reducerAsyncActions(testActions));
    });

    testActions.forEach((action) => {
      test(`properly maps the pending action to the reducerPending handler: ${action}`, () => {
        const pendingAction = { type: `${action}.pending`, payload: data };
        expect(reducer(state, pendingAction)).toEqual({
          ...data,
          api: {
            pending: true,
            updating: '',
            error: null,
            ok: true,
            fetched: false,
          },
        });
      });
      test(`properly maps the ok action to the reducerOK handler: ${action}`, () => {
        const okAction = { type: `${action}.ok`, payload: data };
        expect(reducer(state, okAction)).toEqual({
          ...data,
          api: {
            error: null,
            pending: false,
            ok: true,
            updating: '',
            fetched: false,
          },
        });
      });
      test(`properly maps the fail action to the reducerFail handler: ${action}`, () => {
        const failAction = { type: `${action}.fail`, payload: { status: 401 } };
        expect(reducer(state, failAction)).toEqual({
          api: {
            error: { status: 401 },
            pending: false,
            ok: false,
            updating: '',
            fetched: false,
          },
        });
      });
    });
  });

  test('reducerAsyncActions: allows override of specific handlers via the override parameter', () => {
    const testActions = ['action1', 'action2', 'action3'];
    const overrideHandler = jest.fn();
    const override = {
      ['action2.ok']: overrideHandler,
    };
    const reducerMap = redux.reducerAsyncActions(testActions, override);
    expect(reducerMap['action2.ok']).toBe(overrideHandler);
  });
});

describe('selectors', () => {
  test('apiOnly: returns only api section of state', () => {
    const state = { a: '1', ...redux.INITIAL_ASYNC_STATE };
    const { api } = redux.INITIAL_ASYNC_STATE;
    expect(redux.apiOnly(state)).toEqual(api);
  });

  test('apiOnly: no api property returns empty object', () => {
    const state = { a: '1' } as any;
    expect(redux.apiOnly(state)).toBeUndefined();
  });

  test('withoutApi: returns state with api property removed', () => {
    const state = { a: '1', ...redux.INITIAL_ASYNC_STATE };
    expect(redux.withoutApi(state)).toEqual({ a: '1' });
  });

  test('asValues: returns state key-value map as array (api removed)', () => {
    const state = { a: '1', b: '2', ...redux.INITIAL_ASYNC_STATE };
    expect(redux.asValues(state)).toEqual(['1', '2']);
  });
});
