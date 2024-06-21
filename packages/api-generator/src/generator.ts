import OpenAPIParser from '@readme/openapi-parser'
import { OpenAPIV3_1 } from 'openapi-types'
import openapiTS from 'openapi-typescript'
import { toPascal } from 'ts-case-convert'
import * as fs from 'node:fs/promises'

enum OperationsAliasType {
  REQUEST = 'Request',
  RESPONSE = 'Response'
}

interface IOperationTypeAlias {
  generateName(): string
  toLine(): string
  readonly type: OperationsAliasType
}

class EmptyTypeAlias implements IOperationTypeAlias {
  public readonly type: OperationsAliasType

  constructor(type: OperationsAliasType) {
    this.type = type
  }

  public generateName() {
    return `Empty${this.type}`
  }

  public toLine() {
    let name = this.generateName()

    return `export type ${name} = Record<string, unknown> | undefined`
  }
}

class Endpoint {
  public readonly operationId: string
  public request?: IOperationTypeAlias
  public response?: IOperationTypeAlias

  constructor(operationId: string) {
    this.operationId = operationId
  }

  public toLine() {
    let reqName = this.request?.generateName() ?? emptyRequest.generateName()
    let resName = this.response?.generateName() ?? emptyResponse.generateName()

    return `'${this.operationId}': { req: ${reqName}; res: ${resName} }`
  }
}

class OperationTypeAlias implements IOperationTypeAlias {
  public readonly mediaType: string
  public readonly operationId: string
  public readonly type: OperationsAliasType

  constructor(
    operationId: string,
    mediaType: string,
    type: OperationsAliasType
  ) {
    this.mediaType = mediaType
    this.operationId = operationId
    this.type = type
  }

  public generateName() {
    let nameBase = this.operationId.replace(/\//g, '-')

    return toPascal(nameBase + this.type)
  }

  public toLine() {
    let name = this.generateName()

    return this.type === OperationsAliasType.REQUEST
      ? `export type ${name} = operations['${this.operationId}']['requestBody']['content']['${this.mediaType}']`
      : `export type ${name} = operations['${this.operationId}']['responses']['200']['content']['${this.mediaType}']`
  }
}

const emptyRequest = new EmptyTypeAlias(OperationsAliasType.REQUEST)
const emptyResponse = new EmptyTypeAlias(OperationsAliasType.RESPONSE)

function filterUndefined<T>(item: T): item is Exclude<T, undefined> {
  return item !== undefined
}

async function generateApiClientJsDoc(
  openApiDocs: OpenAPIV3_1.Document,
  apiClientFileName: string,
  endpointsFileName: string,
  warningsOutputPath: string
) {
  let endpoints = [] as { description: string; operationId: string }[]

  // Since `cutiekey.js` is sent with a fixed POST, this is fixed. If there is a
  // need to support a different method, this needs to be fixed as well.
  let paths = openApiDocs.paths ?? {}
  let postPathItems = Object.keys(paths)
    .map(it => paths[it]?.post)
    .filter(filterUndefined)

  for (const operation of postPathItems) {
    let operationId = operation.operationId!

    if (operation.description) {
      endpoints.push({
        description: operation.description,
        operationId
      })
    }
  }

  let endpointOutputLine = [] as string[]

  endpointOutputLine.push(
    `import type { SwitchCaseResponseType } from '${toImportPath(apiClientFileName)}'`
  )

  endpointOutputLine.push(
    `import type { Endpoints } from '${toImportPath(endpointsFileName)}'`
  )

  endpointOutputLine.push('')

  endpointOutputLine.push(
    `declare module '${toImportPath(apiClientFileName)}' {`
  )

  endpointOutputLine.push('  export interface ApiClient {')

  for (let i = 0; i < endpoints.length; i++) {
    let endpoint = endpoints[i]

    endpointOutputLine.push(
      '    /**',
      `     * ${endpoint.description.split('\n').join('\n     * ')}`,
      '     */',
      `    request<E extends '${endpoint.operationId}', P extends Endpoints[E]['req']>(`,
      '      endpoint: E,',
      '      params: P,',
      '      credential?: string | null',
      '    ): Promise<SwitchCaseResponseType<E, P>>'
    )
  }

  endpointOutputLine.push('  }')
  endpointOutputLine.push('}')
  endpointOutputLine.push('')

  await fs.writeFile(warningsOutputPath, endpointOutputLine.join('\n'))
}

async function generateBaseTypes(
  openApiJsonPath: string,
  typeFileName: string
) {
  const disabledLints = [
    '@typescript-eslint/naming-convention',
    '@typescript-eslint/no-explicit-any'
  ]

  let lines = [] as string[]

  for (const lint of disabledLints) {
    lines.push(`/* eslint ${lint}: 0 */`)
  }

  lines.push('')

  let generatedTypes = await openapiTS(openApiJsonPath, { exportType: true })

  lines.push(generatedTypes)
  lines.push('')

  await fs.writeFile(typeFileName, lines.join('\n'))
}

async function generateEndpoints(
  openApiDocs: OpenAPIV3_1.Document,
  typeFileName: string,
  entitiesOutputPath: string,
  endpointOutputPath: string
) {
  let endpoints = [] as Endpoint[]

  // Since `cutiekey.js` is sent with a fixed POST, this is fixed. If there is a
  // need to support a different method, this needs to be fixed as well.
  let paths = openApiDocs.paths ?? {}
  let postPathItems = Object.keys(paths)
    .map(it => paths[it]?.post)
    .filter(filterUndefined)

  for (const operation of postPathItems) {
    let operationId = operation.operationId!

    let endpoint = new Endpoint(operationId)

    endpoints.push(endpoint)

    if (isRequestBodyObject(operation.requestBody)) {
      let reqContent = operation.requestBody.content
      let supportMediaTypes = Object.keys(reqContent)

      if (supportMediaTypes.length > 0) {
        // There are currently no endpoints that take more than one media type,
        // so this is hard-coded
        endpoint.request = new OperationTypeAlias(
          operationId,
          supportMediaTypes[0],
          OperationsAliasType.REQUEST
        )
      }
    }

    if (
      isResponseObject(operation.responses['200']) &&
      operation.responses['200'].content
    ) {
      let resContent = operation.responses['200'].content
      let supportMediaTypes = Object.keys(resContent)

      if (supportMediaTypes.length > 0) {
        // There are currently no endpoints that return more than one media
        // type, so we have this hard-coded
        endpoint.response = new OperationTypeAlias(
          operationId,
          supportMediaTypes[0],
          OperationsAliasType.RESPONSE
        )
      }
    }
  }

  let entitiesOutputLine = [] as string[]

  entitiesOutputLine.push(
    `import { operations } from '${toImportPath(typeFileName)}'`
  )

  entitiesOutputLine.push('')

  entitiesOutputLine.push(
    new EmptyTypeAlias(OperationsAliasType.REQUEST).toLine()
  )

  entitiesOutputLine.push(
    new EmptyTypeAlias(OperationsAliasType.RESPONSE).toLine()
  )

  entitiesOutputLine.push('')

  let entities = endpoints
    .flatMap(it => [it.request, it.response].filter(i => i))
    .filter(filterUndefined)

  entitiesOutputLine.push(...entities.map(it => it.toLine()))
  entitiesOutputLine.push('')

  await fs.writeFile(entitiesOutputPath, entitiesOutputLine.join('\n'))

  let endpointOutputLine = [] as string[]

  endpointOutputLine.push('import type {')

  endpointOutputLine.push(
    ...[emptyRequest, emptyResponse, ...entities].map(
      it => `  ${it.generateName()},`
    )
  )

  endpointOutputLine.push(`} from '${toImportPath(entitiesOutputPath)}'`)

  endpointOutputLine.push('')

  endpointOutputLine.push('export type Endpoints = {')
  endpointOutputLine.push(...endpoints.map(it => `  ${it.toLine()}`))
  endpointOutputLine.push('}')
  endpointOutputLine.push('')

  await fs.writeFile(endpointOutputPath, endpointOutputLine.join('\n'))
}

async function generateSchemaEntities(
  openApiDocs: OpenAPIV3_1.Document,
  typeFileName: string,
  outputPath: string
) {
  if (!openApiDocs.components?.schemas) {
    return
  }

  let schemas = openApiDocs.components.schemas
  let typeAliasLines = [] as string[]

  let schemaNames = Object.keys(schemas)

  typeAliasLines.push(
    `import { components } from '${toImportPath(typeFileName)}'`
  )

  typeAliasLines.push('')

  typeAliasLines.push(
    ...schemaNames.map(
      it => `export type ${it} = components['schemas']['${it}']`
    )
  )

  typeAliasLines.push('')

  await fs.writeFile(outputPath, typeAliasLines.join('\n'))
}

function isRequestBodyObject(
  value: unknown
): value is OpenAPIV3_1.RequestBodyObject {
  if (!value) {
    return false
  }

  let { content } = value as Record<
    keyof OpenAPIV3_1.RequestBodyObject,
    unknown
  >

  return content !== undefined
}

function isResponseObject(value: unknown): value is OpenAPIV3_1.ResponseObject {
  if (!value) {
    return false
  }

  let { description } = value as Record<
    keyof OpenAPIV3_1.ResponseObject,
    unknown
  >

  return description !== undefined
}

async function main() {
  let generatePath = './built/autogen'
  let openApiJsonPath = './api.json'

  let apiClientWarningFileName = `${generatePath}/api-client-jsdoc.ts`
  let endpointFileName = `${generatePath}/endpoint.ts`
  let entitiesFileName = `${generatePath}/entities.ts`
  let modelFileName = `${generatePath}/models.ts`
  let typeFileName = `${generatePath}/types.ts`

  let openApiDocs = (await OpenAPIParser.parse(
    openApiJsonPath
  )) as OpenAPIV3_1.Document

  await fs.mkdir(generatePath, { recursive: true })

  await generateApiClientJsDoc(
    openApiDocs,
    '../api.ts',
    endpointFileName,
    apiClientWarningFileName
  )

  await generateBaseTypes(openApiJsonPath, typeFileName)

  await generateEndpoints(
    openApiDocs,
    typeFileName,
    entitiesFileName,
    endpointFileName
  )

  await generateSchemaEntities(openApiDocs, typeFileName, modelFileName)
}

function toImportPath(
  fileName: string,
  fromPath = '/built/autogen',
  toPath = ''
) {
  return fileName.replace(fromPath, toPath).replace('.ts', '')
}

main()
