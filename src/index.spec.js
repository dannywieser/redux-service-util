import * as utils from './index';

const data = { a: '1', b: '2', c: '3' };

describe('Helper Functions', () => {
  test('pending(): build an action string for a pending action', () => {
    expect(utils.pending('actionname')).toBe('actionname.pending');
  });

  test('ok(): build an action string for a ok action', () => {
    expect(utils.ok('actionname')).toBe('actionname.ok');
  });

  test('fail(): build an action string for a fail action', () => {
    expect(utils.fail('actionname')).toBe('actionname.fail');
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
    expect(utils.ActionFail('action', data)).toEqual({
      type: 'action.fail',
      payload: { ...data },
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
      isLoading: false,
      hasError: false,
    });
  });

  test('ReducerFail(): set isLoading to false, hasError to true, destructure payload', () => {
    const state = { a: '1', isLoading: true };
    const action = { type: 'action', payload: { code: 'errorCode' } };
    expect(utils.ReducerFail(state, action)).toEqual({
      a: '1',
      isLoading: false,
      hasError: true,
      errorCode: 'errorCode',
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
});
