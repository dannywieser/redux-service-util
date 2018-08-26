// pending/ok/fail type state helpers
export const PENDING = 'pending';
export const OK = 'ok';
export const FAIL = 'fail';
export const pending = type => `${type}.${PENDING}`;
export const ok = type => `${type}.${OK}`;
export const fail = type => `${type}.${FAIL}`;

// payload wrapper
export const Payload = data => ({ payload: { ...data } });

// base action builder
export const Action = (type, data) => ({ type, ...data });

// pending/ok/fail action builders
export const ActionSync = (type, payload) => Action(type, Payload(payload));
export const ActionPending = (type, payload) => Action(pending(type), Payload(payload));
export const ActionOK = (type, payload) => Action(ok(type), Payload(payload));
export const ActionFail = (type, error) => Action(fail(type), Payload(error));

// reducer core handlers
export const baseState = (isLoading = false, hasError = false) => ({ isLoading, hasError });
export const ReducerPending = (state, data) => ({ ...state, ...data.payload, ...baseState(true) });
export const ReducerOK = (state, data) => ({ ...state, ...data.payload, ...baseState() });
export const ReducerFail = (state, data) => {
  const { code } = data.payload;
  return {
    ...state,
    ...baseState(false, true),
    errorCode: code,
  };
};

// reducer map creator
export const invokeHandler = (action, map, state) => {
  const { type } = action || {};
  const handler = type ? map[type] : undefined;
  return handler ? handler(state, action) : state;
};
export function createReducer(initialState, handlerMap) {
  return (state = initialState, action) => invokeHandler(action, handlerMap, state);
}
