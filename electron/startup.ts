export const INITIAL_ROUTE_HASH = '/'

export const getDevRendererUrl = (serverUrl: string) =>
  new URL(`app.html#${INITIAL_ROUTE_HASH}`, serverUrl).toString()
