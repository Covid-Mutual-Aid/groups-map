import { map } from 'rxjs/operators'
import { sign } from 'jsonwebtoken'
import { of } from 'rxjs'
import P from 'ts-prove'

import lrx, { LambdaInput, body, params, select, responseJson$ } from './lambdaRx'

jest.mock('./environment', () => ({
  default: { JWT_SECRET: 'SECRET' },
}))

it('Correctly returns an aws lambda callback that resolves an observable to a promise', async () => {
  const res = await lrx((req) => req.pipe(map(() => ({} as any))))({} as any, {} as any)
  expect(res).toEqual({})
})

it('Correctly selects and parses event body', async () => {
  const res = await of({ _event: { body: JSON.stringify({ foo: 'bar' }) } } as LambdaInput)
    .pipe(body())
    .toPromise()
  expect(res).toEqual({ foo: 'bar' })
})

it('Correctly selects and parses event params', async () => {
  const res = await of({ _event: { queryStringParameters: { foo: 'bar' } as any } } as LambdaInput)
    .pipe(params())
    .toPromise()
  expect(res).toEqual({ foo: 'bar' })
})

it('correctly combines pipelin', async () => {
  const token = sign({ id: 'ID' }, 'SECRET')
  const res = await lrx((req) =>
    req.pipe(
      select({
        body: body(P.shape({ foo: P.string })),
        params: params(P.shape({ token: P.string })),
      }),
      map((x) => x),
      responseJson$
    )
  )(
    {
      body: JSON.stringify({ foo: 'bar' }),
      queryStringParameters: { token },
    } as any,
    {} as any
  )

  const result = JSON.parse(res.body)
  expect(result.body).toEqual({ foo: 'bar' })
  expect(result.params).toEqual({ token })
})
