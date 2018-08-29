# redux-service-util
[![Build Status](https://travis-ci.org/danny-wieser/redux-service-util.svg?branch=master)](https://travis-ci.org/danny-wieser/redux-service-util)

Utilities and helpers for creating Redux data services

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

`yarn install redux-service-util`

## functions

This library includes the following functions for reducing boilerplate in the scenario described above:

### action creators

```ActionPending(type, data)```: Given an action type and a payload, return an Action of `actionname.pending`, with the data wrapped with the name `payload`

```js
  { type: 'action.pending', payload: { ... somedata } }
```

```ActionOK(type, data)```: Given an action type and a payload, return an Action of `actionname.ok`, with the data wrapped with the name `payload`

```js
  { type: 'action.ok', payload: { ... somedata } }
```

```ActionFail(type, error)```: Given an action type and a payload, return an Action of `actionname.fail`, with the data wrapped with the name `payload`

```js
  { type: 'action.fail', payload: { error: ...errorDetails } }
```

```ActionAsync(type, handlerFunction, params)```: Combines the above 3 functions into a single call. Given an action type, the async handler function to retrieve the data for that type, and the necessary params, will:
* dispatch the pending action immediately
* invoke the handler function with the provided parameters
* dispatch an OK action on success, with the data from the API wrapped in  `payload`
* dispatch a FAIL action on error, with the error details wrapped in `payload`

### reducer helpers

```ReducerPending(state, action)```: A reducer handler function that will:
* set isLoading to true in state
* deconstruct any `payload` included in the action to become part of the state

```ReducerOK(state, action)```: A reducer handler function that will:
* set isLoading to false in state
* set hasError to false
* deconstruct any `payload` included in the action to become part of the state

```ReducerFail(state, action)```: A reducer handler function that will:
* set isLoading to false in state
* set hasError to true
* retrieve a payload property of `error` and set that value in the state

```ReducerAsync(type)```: A single function to map the 3 handlers noted above to an action type.  

```ReducerAsyncActions(types[])```: A single function to map the pending/ok/fail states to a provided array of action types

```createReducer(initialState, handlerMap)```: helper function to create a reducer based on a map of actions to handler functions.  

```js
createReducer({},
  {
    action1: handlerFunc1(),
    action2: handlerFunc2(),
  });
```

Can be used in conjunction with `ReducerAsync` or `ReducerAsyncActions` to create a reducer that handles pending/fail/ok states for a large set of action types.

```js
createReducer({}, ReducerAsyncActions(['action1', 'action2', 'action3']));
```

### Other helpers

```asyncInvoke(asyncFunc, ...params)```: given an asynchronous function and the parameters required to invoke that function, will invoke the function in a try catch, returning the result in a format of:

**success**

```js
  {
    ok: true,
    data: { /* response from async call */ }
  }
```
**failure**

```js
  {
    ok: false,
    error: { /* error from async call */ }
  }
```

The intent of this function is to prevent the need for repeated try/catch boilerplate in application code - an async call is made and the result is abstracted to a simple response object with an ok value of true or false.


## service modules

The intent of these functions is to be used with a data-service domain-specific module which will trigger the specific API calls required and deconstruct the response into an object that will be passed back to the Redux reducer (ok or failure) and used to populate that state.

The structure of the payload returned from the API is defined in this service object.

For example:

Given an application for managing todos, an API call might be made to retrieve a list of all current todo items.

A redux action defined to retrieve todos could be defined as `fetch_todos`

When that action is invoked, a "pending" action will be dispatched of `fetch_todos.pending`, state will be updated with a loading flag

A `todos` service module is defined that has an exported function of `fetchTodos`.  When invoked, this function will do a GET to a REST API /todos and wait for the response

If the GET is successful, the service call will process the response, likely normalizing te data to work more efficiently with Redux (see https://redux.js.org/recipes/structuringreducers/normalizingstateshape).  This result is wrapped in a payload and returned to the action creator

The action creator dispatches a `fetch_todos.ok` action with the normalized payload provided by the service

(in the case of an error, a `fetch_todos.fail` action would be dispatched with a payload providing details of the error - error details would be extracted and provided by the service as well.)
