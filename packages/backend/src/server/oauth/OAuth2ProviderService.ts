/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import querystring from 'querystring';
import { Inject, Injectable } from '@nestjs/common';
import megalodon, { MegalodonInterface } from 'megalodon';
import { v4 as uuid } from 'uuid';
/* import { kinds } from '@/misc/api-permissions.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js'; */
import multer from 'fastify-multer';
import { bindThis } from '@/decorators.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import type { FastifyInstance } from 'fastify';

const kinds = [
	'read:account',
	'write:account',
	'read:blocks',
	'write:blocks',
	'read:drive',
	'write:drive',
	'read:favorites',
	'write:favorites',
	'read:following',
	'write:following',
	'read:messaging',
	'write:messaging',
	'read:mutes',
	'write:mutes',
	'write:notes',
	'read:notifications',
	'write:notifications',
	'read:reactions',
	'write:reactions',
	'write:votes',
	'read:pages',
	'write:pages',
	'write:page-likes',
	'read:page-likes',
	'read:user-groups',
	'write:user-groups',
	'read:channels',
	'write:channels',
	'read:gallery',
	'write:gallery',
	'read:gallery-likes',
	'write:gallery-likes',
];

function getClient(BASE_URL: string, authorization: string | undefined): MegalodonInterface {
	const accessTokenArr = authorization?.split(' ') ?? [null];
	const accessToken = accessTokenArr[accessTokenArr.length - 1];
	const generator = (megalodon as any).default;
	const client = generator('misskey', BASE_URL, accessToken) as MegalodonInterface;
	return client;
}

@Injectable()
export class OAuth2ProviderService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) { }

	// https://datatracker.ietf.org/doc/html/rfc8414.html
	// https://indieauth.spec.indieweb.org/#indieauth-server-metadata
	public generateRFC8414() {
		return {
			issuer: this.config.url,
			authorization_endpoint: new URL('/oauth/authorize', this.config.url),
			token_endpoint: new URL('/oauth/token', this.config.url),
			scopes_supported: kinds,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code'],
			service_documentation: 'https://misskey-hub.net',
			code_challenge_methods_supported: ['S256'],
			authorization_response_iss_parameter_supported: true,
		};
	}

	@bindThis
	public async createServer(fastify: FastifyInstance): Promise<void> {
		// https://datatracker.ietf.org/doc/html/rfc8414.html
		// https://indieauth.spec.indieweb.org/#indieauth-server-metadata
		/* fastify.get('/.well-known/oauth-authorization-server', async (_request, reply) => {
			reply.send({
				issuer: this.config.url,
				authorization_endpoint: new URL('/oauth/authorize', this.config.url),
				token_endpoint: new URL('/oauth/token', this.config.url),
				scopes_supported: kinds,
				response_types_supported: ['code'],
				grant_types_supported: ['authorization_code'],
				service_documentation: 'https://misskey-hub.net',
				code_challenge_methods_supported: ['S256'],
				authorization_response_iss_parameter_supported: true,
			});
		}); */

		const upload = multer({
			storage: multer.diskStorage({}),
			limits: {
				fileSize: this.config.maxFileSize || 262144000,
				files: 1,
			},
		});

		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Access-Control-Allow-Origin', '*');
			done();
		});

		fastify.addContentTypeParser('application/x-www-form-urlencoded', (request, payload, done) => {
			let body = '';
			payload.on('data', (data) => {
				body += data;
			});
			payload.on('end', () => {
				try {
					const parsed = querystring.parse(body);
					done(null, parsed);
				} catch (e: any) {
					done(e);
				}
			});
			payload.on('error', done);
		});

		fastify.register(multer.contentParser);

		fastify.get('/authorize', async (request, reply) => {
			const query: any = request.query;
			let param = "mastodon=true";
			if (query.state) param += `&state=${query.state}`;
			if (query.redirect_uri) param += `&redirect_uri=${query.redirect_uri}`;
			const client = query.client_id ? query.client_id : "";
			reply.redirect(
				`${Buffer.from(client.toString(), 'base64').toString()}?${param}`,
			);
		});

		fastify.get('/authorize/', async (request, reply) => {
			const query: any = request.query;
			let param = "mastodon=true";
			if (query.state) param += `&state=${query.state}`;
			if (query.redirect_uri) param += `&redirect_uri=${query.redirect_uri}`;
			const client = query.client_id ? query.client_id : "";
			reply.redirect(
				`${Buffer.from(client.toString(), 'base64').toString()}?${param}`,
			);
		});

		fastify.post('/token', { preHandler: upload.none() }, async (request, reply) => {
			const body: any = request.body || request.query;
			if (body.grant_type === "client_credentials") {
				const ret = {
					access_token: uuid(),
					token_type: "Bearer",
					scope: "read",
					created_at: Math.floor(new Date().getTime() / 1000),
				};
				reply.send(ret);
			}
			let client_id: any = body.client_id;
			const BASE_URL = `${request.protocol}://${request.hostname}`;
			const client = getClient(BASE_URL, '');
			let token = null;
			if (body.code) {
				//m = body.code.match(/^([a-zA-Z0-9]{8})([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})([a-zA-Z0-9]{12})/);
				//if (!m.length) {
				//	ctx.body = { error: "Invalid code" };
				//	return;
				//}
				//token = `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`
				//console.log(body.code, token);
				token = body.code;
			}
			if (client_id instanceof Array) {
				client_id = client_id.toString();
			} else if (!client_id) {
				client_id = null;
			}
			try {
				const atData = await client.fetchAccessToken(
					client_id,
					body.client_secret,
					token ? token : "",
				);
				const ret = {
					access_token: atData.accessToken,
					token_type: "Bearer",
					scope: body.scope || "read write follow push",
					created_at: Math.floor(new Date().getTime() / 1000),
				};
				reply.send(ret);
			} catch (err: any) {
				/* console.error(err); */
				reply.code(401).send(err.response.data);
			}
		});
	}
}
