import type { Endpoints as Gen } from '@/autogen/endpoint'
import type { UsersShowRequest } from '@/autogen/entities'
import type { UserDetailed } from '@/autogen/models'
import type {
  SigninRequest,
  SigninResponse,
  SignupPendingRequest,
  SignupPendingResponse,
  SignupRequest,
  SignupResponse
} from '@/entities'

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

type SwitchCase<Condition = unknown, Result = unknown> = {
  $switch: {
    $cases: [Condition, Result][]
    $default: Result
  }
}

export type Endpoints = Overwrite<
  Gen,
  {
    signin: {
      req: SigninRequest
      res: SigninResponse
    }
    signup: {
      req: SignupRequest
      res: SignupResponse
    }
    'signup-pending': {
      req: SignupPendingRequest
      res: SignupPendingResponse
    }
    'users/show': {
      req: UsersShowRequest
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
