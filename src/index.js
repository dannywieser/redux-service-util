// pending/ok/fail type state helpers
export const PENDING = 'pending';
export const OK = 'ok';
export const FAIL = 'fail';
export const typePending = type => `${type}.${PENDING}`;
export const typeOK = type => `${type}.${OK}`;
export const typeFail = type => `${type}.${FAIL}`;

// payload wrapper
export const Payload = data => ({ payload: { ...data } });

// base action builder
export const Action = (type, data) => ({ type, ...data });

// pending/ok/fail action builders
export const ActionSync = (type, payload) => Action(type, Payload(payload));
export const ActionPending = (type, payload) => Action(typePending(type), Payload(payload));
export const ActionOK = (type, payload) => Action(typeOK(type), Payload(payload));
export const ActionFail = (type, error) => Action(typeFail(type), Payload(error));
// async action builder: create an action combining pending/ok/fail states
// parameters: type, handler function and params
export const ActionAsync = (type, handler, ...params) => async (dispatch) => {
  dispatch(ActionPending(type));
  const { ok, payload, error } = await handler(...params);
  const action = ok ? ActionOK(type, payload) : ActionFail(type, error);
  dispatch(action);
};

// reducer core handlers
export const baseState = (isLoading = false, hasError = false) => ({ isLoading, hasError });
export const ReducerPending = (state, data) => ({ ...state, ...data.payload, ...baseState(true) });
export const ReducerOK = (state, data) => ({ ...state, ...data.payload, ...baseState() });
export const ReducerFail = (state, data) => {
  const { error } = data.payload;
  return {
    ...state,
    ...baseState(false, true),
    errorDetail: error,
  };
};
// create a reducer combining pending/ok/fail handlers
export const ReducerAsync = type => ({
  [typePending(type)]: (state, action) => ReducerPending(state, action),
  [typeOK(type)]: (state, action) => ReducerOK(state, action),
  [typeFail(type)]: (state, action) => ReducerFail(state, action),
});
const handlerReducer = (handlers, type) => ({ ...handlers, ...ReducerAsync(type) });
export const ReducerAsyncActions = actions => actions.reduce(handlerReducer, {});

// reducer map creator
export const invokeHandler = (action, map, state) => {
  const { type } = action || {};
  const handler = type ? map[type] : undefined;
  return handler ? handler(state, action) : state;
};
export function createReducer(initialState, handlerMap) {
  return (state = initialState, action) => invokeHandler(action, handlerMap, state);
}

// async invoke with ok/error/payload response
export const asyncInvoke = async (asyncFunc, ...params) => {
  let result;
  try {
    const data = await asyncFunc(...params);
    result = { ok: true, data };
  } catch (error) {
    result = { ok: false, error };
  }
  return result;
};
