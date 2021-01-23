import mock from 'mock-require'

export function mockModule (path: string, stub: any) {
  mock(path, stub)
}
