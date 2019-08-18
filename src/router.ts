type RouteNamesUnion<Routes extends DefaultRoutes> = Routes[number]['name']
type RouteNamesUnionWithEmptyParams<Routes extends DefaultRoutes> = (Routes[number] & {
  placeholders: readonly []
})['name']
type RouteParamsByName<Routes extends DefaultRoutes, Name extends RouteNamesUnion<Routes>> = {
  [K in (Routes[number] & { name: Name })['placeholders'][number]['name']]: string
}

type Router<Routes extends DefaultRoutes> = {
  navigate<Name extends RouteNamesUnion<Routes>>(
    name: Name,
    params: RouteParamsByName<Routes, Name>
  ): void
  navigate<Name extends RouteNamesUnionWithEmptyParams<Routes>>(name: Name): void
  onUpdate(route: MatchedRoutes<Routes[number]>): void
  start(): void
  stop(): void
}

type Placeholder<Name extends string> = {
  name: Name
}

type Route<Name extends string, Placeholders extends ReadonlyArray<Placeholder<string>>> = {
  name: Name
  placeholders: Placeholders
  pattern: RegExp
  templateStrings: TemplateStringsArray
}

type DefaultRoutes = ReadonlyArray<Route<string, ReadonlyArray<Placeholder<string>>>>

type MatchedRoutes<R extends Route<string, ReadonlyArray<Placeholder<string>>>> = R extends Route<
  infer Name,
  infer Placeholders
>
  ? { name: Name; params: PlaceholdersToParams<Placeholders> }
  : never

type PlaceholdersToParams<Placeholders extends ReadonlyArray<Placeholder<string>>> = {
  [K in Placeholders[number]['name']]: string
}

function makeRouter<Routes extends DefaultRoutes>(routes: Routes): Router {
  type RoutesUnion = Routes[number]

  function matchRoute(path: string): MatchedRoutes<RoutesUnion> | null {
    for (const { name, placeholders, pattern } of routes) {
      const m = path.match(pattern)
      if (m == null) continue
      const params: { [K: string]: string } = {}
      for (const [i, ph] of placeholders.entries()) {
        const val = m[i + 1]
        params[ph.name] = val
      }
      return { name, params } as MatchedRoutes<Routes[number]>
    }
    return null
  }

  const routesByName: { [K in RoutesUnion['name']]: RoutesUnion & { name: K } } = {} as any
  for (const route of routes) {
    routesByName[route.name as RoutesUnion['name']] = route
  }

  function makeUrl<Name extends RoutesUnion['name']>(
    name: Name,
    params: PlaceholdersToParams<(RoutesUnion & { name: Name })['placeholders']>
  ): string
  function makeUrl<Name extends (RoutesUnion & { placeholders: readonly [] })['name']>(
    name: Name
  ): string
  function makeUrl<Name extends RoutesUnion['name']>(name: Name, params?: any): string {
    if (params == null) {
      params = {}
    }

    const route = routesByName[name]
    if (route == null) {
      throw new Error(`Unknown route name: ${name}`)
    }

    const { placeholders, templateStrings } = route
    let path = templateStrings[0]
    for (const [i, { name }] of placeholders.entries()) {
      const v = params[name]
      if (v == null) {
        throw new Error(`Undefined parameter: ${name}`)
      }
      path += v
      path += templateStrings[i + 1]
    }
    return path
  }
}

function Route<Name extends string>(
  name: Name
): <Placeholders extends ReadonlyArray<Placeholder<string>>>(
  ss: TemplateStringsArray,
  ...placeholders: Placeholders
) => Route<Name, Placeholders> {
  return (ss, ...placeholders) => {
    let s = '^' + ss[0]
    placeholders.forEach((_, i) => {
      s += '([^/]+?)'
      s += ss[i + 1]
    })
    if (!/\/$/.test(s)) {
      s += '/?'
    }
    s += '$'

    return {
      name,
      placeholders,
      pattern: new RegExp(s),
      templateStrings: ss
    }
  }
}
