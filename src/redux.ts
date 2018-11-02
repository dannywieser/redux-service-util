export interface IAction {
  type: string;
  payload?: Object;
}
export interface IErrorDetail {
  status?: string;
  data?: any;
}
export interface IApiState {
  pending?: boolean;
  ok?: boolean;
  error?: IErrorDetail;
  fetched?: boolean;
  updating?: string;
}
export interface IBaseState {
  api: IApiState;
}
export interface IAsyncOpts {
  fetching?: boolean; // if true, will trigger api.fetched to be set to true on OK
  updating?: string; // either "new" for adding a new item, or the ID of an item being updated by an action
}
export interface IAsyncReducer {
  [actionType: string]: (state: IBaseState, action: IAction) => IBaseState;
}
export interface IAsyncActionOpts {
  type: string;
  fetched?: boolean;
  updating?: string;
  handler: Function;
}

// pending/ok/fail type state helpers
export const PENDING = 'pending';
export const OK = 'ok';
export const FAIL = 'fail';
export const typePending = (type: string) => `${type}.${PENDING}`;
export const typeOK = (type: string) => `${type}.${OK}`;
export const typeFail = (type: string) => `${type}.${FAIL}`;

// base action builder
export const buildAction = (type: string, payload: Object): IAction => ({ type, payload });

// pending/ok/fail action builders
export const actionSync = (type: string, payload: Object): IAction => buildAction(type, payload);
export const actionPending = (type: string, payload: Object = {}): IAction => buildAction(typePending(type), payload);
export const actionOK = (type: string, payload: Object): IAction => buildAction(typeOK(type), payload);
export const actionFail = (type: string, payload: Object): IAction => buildAction(typeFail(type), payload);

export const processApiOpts = (fetched: boolean, updating: string): IBaseState =>
  fetched ? ({ api: { fetched, updating } }) : ({ api: { updating } });
// async action builder: create an action combining pending/ok/fail states
// parameters: type, handler function and params
export const actionAsync = (opts: IAsyncActionOpts, ...params: any[]) => async (dispatch: Function) => {
  const { type, fetched, updating = '', handler } = opts;
  dispatch(actionPending(type, processApiOpts(fetched, updating)));
  const { ok, payload } = await handler(...params);
  const withOpts = { ...payload, ...processApiOpts(fetched, updating) };
  const action = ok ? actionOK(type, withOpts) : actionFail(type, payload);
  dispatch(action);
};

// reducer core handlers
export const INITIAL_ASYNC_STATE: IBaseState = {
  api: {
    pending: false,
    ok: true,
    error: null,
    fetched: false,
    updating: '',
  },
};
export const wrapApi = (api: any): IBaseState => ({ api });
export const apiState = (state: IBaseState, update?: Object): IBaseState => {
  const { api = {} } = state;
  return wrapApi({ ...api, ...update });
};
export const reducerPending = (state: IBaseState, data: any) => {
  // if an item is being updated by the async action, the payload will include an api.updating property containing the ID of the item
  // being updated. this is mapped to the overall api state
  const { api = {} } = data.payload;
  const { updating = '' } = api;
  return ({ ...state, ...data.payload, ...apiState(state, { updating, pending: true }) });
};
export const apiStateOK = (api: IApiState): IApiState => ({
  ...api,
  ok: true,
  updating: '',
  error: null as IErrorDetail,
  pending: false,
});
export const reducerOK = (state: IBaseState, data: any) => {
  const { api = {} } = data.payload;
  return { ...state, ...data.payload, ...apiState(state, apiStateOK(api)) };
};
export const apiStateFail = (error: any): IApiState => ({ error, pending: false, ok: false, updating: '' });
export const reducerFail = (state: IBaseState, data: IAction): IBaseState => ({
  ...state,
  ...apiState(state, apiStateFail(data.payload)),
});

// create a reducer combining pending/ok/fail handlers
export const reducerAsync = (type: string): IAsyncReducer => ({
  [typePending(type)]: (state: IBaseState, action: IAction) => reducerPending(state, action),
  [typeOK(type)]: (state: IBaseState, action: IAction) => reducerOK(state, action),
  [typeFail(type)]: (state: IBaseState, action: IAction) => reducerFail(state, action),
});
const handlerReducer = (handlers: any, type: string) => ({ ...handlers, ...reducerAsync(type) });
export const reducerAsyncActions = (actions: string[], overrides = {}) => {
  const baseActions = actions.reduce(handlerReducer, {});
  return { ...baseActions, ...overrides };
};

// reducer map creator
export const callHandler = (action: IAction, map: any, state: IBaseState) => {
  const { type = '' } = action || {};
  const handler = type ? map[type] : undefined;
  if (!handler && (type && !type.startsWith('@@redux'))) {
    console.error(`ERROR: no handler mapped for: ${type}`);
  }
  return handler ? handler(state, action) : state;
};
export const createReducer = (initState: IBaseState, handlerMap: any) =>
  (state = initState, action: IAction) => callHandler(action, handlerMap, state);

// common selectors
export const apiOnly = (state: IBaseState): IApiState => {
  const { api } = state;
  return api;
};
export const withoutApi = (state: IBaseState) => {
  const { api, ...withoutApi } = state;
  return withoutApi;
};
export const asValues = (state: IBaseState) => Object.values(withoutApi(state));
