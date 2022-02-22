import searchSalesP1 from './fixtures/localhost.contacts_q=sales_p=1.json'
import { foo } from './fixtures/object.json'

describe('fixtures', () => {
  test('import with special chars', () => {
    expect(searchSalesP1[0].id).toBe(1)
  })

  test('prop import', () => {
    expect(foo).toBe('bar')
  })
})
