import { configureStore } from "@reduxjs/toolkit"
import { ideasApi } from "./api/ideasApi"
import { dashboardApi } from "./api/dashboardApi"
import { profileApi } from "./api/profileApi"

export const makeStore = () => {
  return configureStore({
    reducer: {
      [ideasApi.reducerPath]: ideasApi.reducer,
      [dashboardApi.reducerPath]: dashboardApi.reducer,
      [profileApi.reducerPath]: profileApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(ideasApi.middleware)
        .concat(dashboardApi.middleware)
        .concat(profileApi.middleware),
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
