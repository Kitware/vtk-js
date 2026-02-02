export const BASE_URL: string = '/vtk-js/'

export const withBase = (path: string): string => `${ BASE_URL + path }`.replace(/\/+/g, '/')

export const isProd: boolean = process.env.NODE_ENV === 'production'

export const isDev: boolean = !isProd
