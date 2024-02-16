import type { Endpoints as Gen } from '@/autogen/endpoints'
import type { UserDetailed } from '@/autogen/models'
import type * as Entities from '@/entities'

type GetCaseResult<
  E extends keyof Endpoints,
  P extends Endpoints[E]['req'],
  C extends number
> = Endpoints[E]['res'] extends SwitchCase
  ? StrictExtract<Endpoints[E]['res']['$switch']['$cases'][C], [P, any]>[1]
  : never

type IsCaseMatched<
  E extends keyof Endpoints,
  P extends Endpoints[E]['req'],
  C extends number
> = Endpoints[E]['res'] extends SwitchCase
  ? IsNeverType<
      StrictExtract<Endpoints[E]['res']['$switch']['$cases'][C], [P, any]>
    > extends false
    ? true
    : false
  : false

type IsNeverType<T> = [T] extends [never] ? true : false

type Overwrite<T, U extends { [K in keyof T]?: unknown }> = Omit<T, keyof U> & U

type StrictExtract<Union, Cond> = Cond extends Union ? Union : never

type SwitchCase = {
  $switch: {
    $cases: [any, any][]
    $default: any
  }
}

export type Endpoints = Overwrite<
  Gen,
  {
    signin: {
      req: Entities.SigninRequest
      res: Entities.SigninResponse
    }
    signup: {
      req: Entities.SignupRequest
      res: Entities.SignupResponse
    }
    'signup-pending': {
      req: Entities.SignupPendingRequest
      res: Entities.SignupPendingResponse
    }
    'users/show': {
      req: Entities.UsersShowRequest
      res: {
        $switch: {
          $cases: [
            [
              {
                userIds?: string[]
              },
              UserDetailed[]
            ]
          ]
          $default: UserDetailed
        }
      }
    }
  }
>

export type SwitchCaseResponseType<
  E extends keyof Endpoints,
  P extends Endpoints[E]['req']
> = Endpoints[E]['res'] extends SwitchCase
  ? IsCaseMatched<E, P, 0> extends true
    ? GetCaseResult<E, P, 0>
    : IsCaseMatched<E, P, 1> extends true
      ? GetCaseResult<E, P, 1>
      : IsCaseMatched<E, P, 2> extends true
        ? GetCaseResult<E, P, 2>
        : IsCaseMatched<E, P, 3> extends true
          ? GetCaseResult<E, P, 3>
          : IsCaseMatched<E, P, 4> extends true
            ? GetCaseResult<E, P, 4>
            : IsCaseMatched<E, P, 5> extends true
              ? GetCaseResult<E, P, 5>
              : IsCaseMatched<E, P, 6> extends true
                ? GetCaseResult<E, P, 6>
                : IsCaseMatched<E, P, 7> extends true
                  ? GetCaseResult<E, P, 7>
                  : IsCaseMatched<E, P, 8> extends true
                    ? GetCaseResult<E, P, 8>
                    : IsCaseMatched<E, P, 9> extends true
                      ? GetCaseResult<E, P, 9>
                      : Endpoints[E]['res']['$switch']['$default']
  : Endpoints[E]['res']
