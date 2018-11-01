# redux-service-util

Utilities and helpers for creating Redux Data Services

## overview

When creating Redux state that is mapped to asynchronous APIs, a common pattern emerges:
* the async API call is made, a **pending** action is dispatched with the main purpose of setting a flag in the state to indicate that the state is loading or pending a response
* if the async call is successful, an **ok** action is dispatched, at which point the state is populated with the results of the API, and the loading state is cleared
* if the async call fails, a **fail** action action is dispatched, and the state is populated with details that can be used to provide feedback/details to the user about what went wrong.

Managing this type of state via Redux often leads to a lot of boilerplate code that is common across different API calls.

This library provides a small, simple set of utilities meant to eliminate this boilerplate in favor of writing simple code that will map API responses to payloads that will populate the state.

A typical **action creator** for the scenario described above would accept the parameters required to make the API call and handle the async (promise) management, dispatching either the **ok** or **fail** states as needed

A typical **reducer** in this scenario would set a loading flag to true/false, an error flag to true/false, or populate the state with a payload of data retrieved via the API.

## installation

`yarn add redux-service-util`

## functions

This library includes the following functions for reducing boilerplate in the scenario described above:

### action creators

```actionPending(type, data)```: Given an action type and a payload, return an Action of `actionname.pending`, with the data wrapped with the name `payload`

```js
  { type: 'action.pending', payload: { ... somedata } }
```

```actionOK(type, data)```: Given an action type and a payload, return an Action of `actionname.ok`, with the data wrapped with the name `payload`

```js
  { type: 'action.ok', payload: { ... somedata } }
```

```actionFail(type, error)```: Given an action type and a payload, return an Action of `actionname.fail`, with the data wrapped with the name `payload`

```js
  { type: 'action.fail', payload: { error: ...errorDetails } }
```

Where errorDetails is of type `IErrorDetails`, containing the status code and the error response body as 'data'

```actionAsync(opts: IAsyncActionOpts, ...params: any[])```: Combines the above 3 functions into a single call. Given an action type, the async handler function to retrieve the data for that type, and the necessary params, will:
* dispatch the pending action immediately
* invoke the handler function with the provided parameters
* dispatch an OK action on success, with the data from the API wrapped in  `payload`
* dispatch a FAIL action on error, with the error details wrapped in `payload`

The IAsyncActionOpts options object consists of the following properties:
type: (required) - the action type being invoked
handler: (required) - the async handler to be invoked for the action
fetched: (optional) - if set to true, will set the "fetched" flag in the API state. This is used to indicate to the UI that an initial list request has been made to the API
updating: (optional) - set either to "new" or an item ID that is being updated by the action, to allow for the UI to isolate which item is being updated by an async API action.

### reducer helpers

```reducerPending(state, action)```: A reducer handler function that will:
* set pending to true in state
* deconstruct any `payload` included in the action to become part of the state

```reducerOK(state, action)```: A reducer handler function that will:
* set pending to false in state
* set ok to true
* deconstruct any `payload` included in the action to become part of the state

```reducerFail(state, action)```: A reducer handler function that will:
* set pending to false in state
* set ok to false
* retrieve a payload property of `error` and set that value in the state

```reducerAsync(type)```: A single function to map the 3 handlers noted above to an action type.  

```reducerAsyncActions(types[], overrides?)```: A single function to map the pending/ok/fail states to a provided array of action types. If a particular action or actions needs an override from the default handler, an map object can be provided with just the override handlers.  

Example:

```js
{ [typeOK('actionname')]: (state: IBaseState, action: IAction) => customHandler(state, action) }
```

```createReducer(initialState, handlerMap)```: helper function to create a reducer based on a map of actions to handler functions.  

```js
createReducer({},
  {
    action1: handlerFunc1(),
    action2: handlerFunc2(),
  });
```

Can be used in conjunction with `reducerAsync` or `reducerAsyncActions` to create a reducer that handles pending/fail/ok states for a large set of action types.

```js
createReducer({}, reducerAsyncActions(['action1', 'action2', 'action3']));
```

### selector helpers

```apiOnly(state)```: returns only the api property of IBaseState
```withoutApi(state)```: returns IBaseState with the api property removed
```asValues(state)```: assuming a state consisting of a key-value map, will remove the API section and return the map of values as an array.

### http/fetch helpers

`doFetch(path)`

`doPost(path, body)`

`doPatch(path, body)`

`doDelete(path)`

These helper functions will perform these basic HTTP operations given a path and body and return a standardized object response with properties of `ok`, `data`, and `status`

**success**

```js
  {
    ok: true,
    data: { /* response body */ },
    status: 200
  }
```
**failure**

```js
  {
    ok: false,
    data: { /* response body */ }
    status: 4xx or 5xx or 0
  }
```

The intent of this function is to prevent the need for repeated try/catch boilerplate in application code - an async call is made and the result is abstracted to a simple response object with an ok value of true or false.


## service modules

The intent of these functions is to be used with a data-service domain-specific module which will trigger the specific API calls required and deconstruct the response into an object that will be passed back to the Redux reducer (ok or failure) and used to populate that state.

The structure of the payload returned from the API is defined in this service object.

For example:

Given an application for managing todos, an API call might be made to retrieve a list of all current todo items.

A redux action defined to retrieve todos could be defined as `fetch_todos`

When that action is invoked, a "pending" action will be dispatched of `fetch_todos.pending`, state will be updated with a pending flag

A `todos` service module is defined that has an exported function of `fetchTodos`.  When invoked, this function will do a GET to a REST API /todos and wait for the response

If the GET is successful, the service call will process the response, likely normalizing te data to work more efficiently with Redux (see https://redux.js.org/recipes/structuringreducers/normalizingstateshape).  This result is wrapped in a payload and returned to the action creator

The action creator dispatches a `fetch_todos.ok` action with the normalized payload provided by the service

(in the case of an error, a `fetch_todos.fail` action would be dispatched with a payload providing details of the error - error details would be extracted and provided by the service as well.)
