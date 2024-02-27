/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { MiNote } from '@/models/Note.js';
import { MiUser } from '@/models/_.js';
import type { NotesRepository } from '@/models/_.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { CacheService } from '@/core/CacheService.js';
import { QueryService } from '@/core/QueryService.js';
import { IdService } from '@/core/IdService.js';
import type { Index, MeiliSearch } from 'meilisearch';

type K = string;
type V = string | number | boolean;
type Q =
	{ op: '=', k: K, v: V } |
	{ op: '!=', k: K, v: V } |
	{ op: '>', k: K, v: number } |
	{ op: '<', k: K, v: number } |
	{ op: '>=', k: K, v: number } |
	{ op: '<=', k: K, v: number } |
	{ op: 'is null', k: K} |
	{ op: 'is not null', k: K} |
	{ op: 'and', qs: Q[] } |
	{ op: 'or', qs: Q[] } |
	{ op: 'not', q: Q };

function compileValue(value: V): string {
	if (typeof value === 'string') {
		return `'${value}'`; // TODO: escape
	} else if (typeof value === 'number') {
		return value.toString();
	} else if (typeof value === 'boolean') {
		return value.toString();
	}
	throw new Error('unrecognized value');
}

function compileQuery(q: Q): string {
	switch (q.op) {
		case '=': return `(${q.k} = ${compileValue(q.v)})`;
		case '!=': return `(${q.k} != ${compileValue(q.v)})`;
		case '>': return `(${q.k} > ${compileValue(q.v)})`;
		case '<': return `(${q.k} < ${compileValue(q.v)})`;
		case '>=': return `(${q.k} >= ${compileValue(q.v)})`;
		case '<=': return `(${q.k} <= ${compileValue(q.v)})`;
		case 'and': return q.qs.length === 0 ? '' : `(${ q.qs.map(_q => compileQuery(_q)).join(' AND ') })`;
		case 'or': return q.qs.length === 0 ? '' : `(${ q.qs.map(_q => compileQuery(_q)).join(' OR ') })`;
		case 'is null': return `(${q.k} IS NULL)`;
		case 'is not null': return `(${q.k} IS NOT NULL)`;
		case 'not': return `(NOT ${compileQuery(q.q)})`;
		default: throw new Error('unrecognized query operator');
	}
}

@Injectable()
export class SearchService {
	private readonly meilisearchIndexScope: 'local' | 'global' | string[] = 'local';
	private meilisearchNoteIndex: Index | null = null;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meilisearch)
		private meilisearch: MeiliSearch | null,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private cacheService: CacheService,
		private queryService: QueryService,
		private idService: IdService,
	) {
		if (meilisearch) {
			this.meilisearchNoteIndex = meilisearch.index(`${this.config.meilisearch?.index}---notes`);
			this.meilisearchNoteIndex.updateSettings({
				searchableAttributes: [
					'text',
					'cw',
				],
				sortableAttributes: [
					'createdAt',
				],
				filterableAttributes: [
					'createdAt',
					'userId',
					'userHost',
					'channelId',
					'tags',
					'attachedFileTypes',
				],
				typoTolerance: {
					enabled: false,
				},
				pagination: {
					maxTotalHits: 10000,
				},
			});
		}

		if (this.config.meilisearch?.scope) {
			this.meilisearchIndexScope = this.config.meilisearch.scope;
		}
	}

	@bindThis
	public async indexNote(note: MiNote): Promise<void> {
		if (note.text == null && note.cw == null) return;
		if (!['home', 'public'].includes(note.visibility)) return;

		if (this.meilisearch) {
			switch (this.meilisearchIndexScope) {
				case 'global':
					break;

				case 'local':
					if (note.userHost == null) break;
					return;

				default: {
					if (note.userHost == null) break;
					if (this.meilisearchIndexScope.includes(note.userHost)) break;
					return;
				}
			}

			await this.meilisearchNoteIndex?.addDocuments([{
				id: note.id,
				createdAt: this.idService.parse(note.id).date.getTime(),
				userId: note.userId,
				userHost: note.userHost,
				channelId: note.channelId,
				cw: note.cw,
				text: note.text,
				tags: note.tags,
				attachedFileTypes: note.attachedFileTypes,
			}], {
				primaryKey: 'id',
			});
		}
	}

	@bindThis
	public async unindexNote(note: MiNote): Promise<void> {
		if (!['home', 'public'].includes(note.visibility)) return;

		if (this.meilisearch) {
			this.meilisearchNoteIndex!.deleteDocument(note.id);
		}
	}

	@bindThis
	public async searchNote(q: string, me: MiUser | null, opts: {
		userId?: MiNote['userId'] | null;
		channelId?: MiNote['channelId'] | null;
		host?: string | null;
		filetype?: string | null;
		order?: string | null;
		disableMeili?: boolean | null;
	}, pagination: {
		untilId?: MiNote['id'];
		sinceId?: MiNote['id'];
		limit?: number;
	}): Promise<MiNote[]> {
		if (this.meilisearch && !opts.disableMeili) {
			const filter: Q = {
				op: 'and',
				qs: [],
			};
			if (pagination.untilId) filter.qs.push({ op: '<', k: 'createdAt', v: this.idService.parse(pagination.untilId).date.getTime() });
			if (pagination.sinceId) filter.qs.push({ op: '>', k: 'createdAt', v: this.idService.parse(pagination.sinceId).date.getTime() });
			if (opts.userId) filter.qs.push({ op: '=', k: 'userId', v: opts.userId });
			if (opts.channelId) filter.qs.push({ op: '=', k: 'channelId', v: opts.channelId });
			if (opts.host) {
				if (opts.host === '.') {
					filter.qs.push({ op: 'is null', k: 'userHost' });
				} else {
					filter.qs.push({ op: '=', k: 'userHost', v: opts.host });
				}
			}
			if (opts.filetype) {
				if (opts.filetype === 'image') {
					filter.qs.push({ op: 'or', qs: [
						{ op: '=', k: 'attachedFileTypes', v: 'image/webp' }, 
						{ op: '=', k: 'attachedFileTypes', v: 'image/png' },
						{ op: '=', k: 'attachedFileTypes', v: 'image/jpeg' },
						{ op: '=', k: 'attachedFileTypes', v: 'image/avif' },
						{ op: '=', k: 'attachedFileTypes', v: 'image/apng' },
						{ op: '=', k: 'attachedFileTypes', v: 'image/gif' },
					] });
				} else if (opts.filetype === 'video') {
					filter.qs.push({ op: 'or', qs: [
						{ op: '=', k: 'attachedFileTypes', v: 'video/mp4' }, 
						{ op: '=', k: 'attachedFileTypes', v: 'video/webm' },
						{ op: '=', k: 'attachedFileTypes', v: 'video/mpeg' },
						{ op: '=', k: 'attachedFileTypes', v: 'video/x-m4v' },
					] });
				} else if (opts.filetype === 'audio') {
					filter.qs.push({ op: 'or', qs: [
						{ op: '=', k: 'attachedFileTypes', v: 'audio/mpeg' }, 
						{ op: '=', k: 'attachedFileTypes', v: 'audio/flac' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/wav' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/aac' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/webm' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/opus' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/ogg' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/x-m4a' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/mod' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/s3m' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/xm' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/it' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/x-mod' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/x-s3m' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/x-xm' },
						{ op: '=', k: 'attachedFileTypes', v: 'audio/x-it' },
					] });
				}
			}
			const res = await this.meilisearchNoteIndex!.search(q, {
				sort: [`createdAt:${opts.order ? opts.order : 'desc'}`],
				matchingStrategy: 'all',
				attributesToRetrieve: ['id', 'createdAt'],
				filter: compileQuery(filter),
				limit: pagination.limit,
			});
			if (res.hits.length === 0) return [];
			const [
				userIdsWhoMeMuting,
				userIdsWhoBlockingMe,
			] = me ? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
				this.cacheService.userBlockedCache.fetch(me.id),
			]) : [new Set<string>(), new Set<string>()];
			const notes = (await this.notesRepository.findBy({
				id: In(res.hits.map(x => x.id)),
			})).filter(note => {
				if (me && isUserRelated(note, userIdsWhoBlockingMe)) return false;
				if (me && isUserRelated(note, userIdsWhoMeMuting)) return false;
				return true;
			});
			return notes.sort((a, b) => a.id > b.id ? -1 : 1);
		} else {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), pagination.sinceId, pagination.untilId);

			if (opts.userId) {
				query.andWhere('note.userId = :userId', { userId: opts.userId });
			} else if (opts.channelId) {
				query.andWhere('note.channelId = :channelId', { channelId: opts.channelId });
			}

			query
				.andWhere('note.text ILIKE :q', { q: `%${ sqlLikeEscape(q) }%` })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			if (opts.host) {
				if (opts.host === '.') {
					query.andWhere('user.host IS NULL');
				} else {
					query.andWhere('user.host = :host', { host: opts.host });
				}
			}

			if (opts.filetype) {
				/* this is very ugly, but the "correct" solution would
				  be `and exists (select 1 from
				  unnest(note."attachedFileTypes") x(t) where t like
				  :type)` and I can't find a way to get TypeORM to
				  generate that; this hack works because `~*` is
				  "regexp match, ignoring case" and the stringified
				  version of an array of varchars (which is what
				  `attachedFileTypes` is) looks like `{foo,bar}`, so
				  we're looking for opts.filetype as the first half of
				  a MIME type, either at start of the array (after the
				  `{`) or later (after a `,`) */
				query.andWhere(`note."attachedFileTypes"::varchar ~* :type`, { type: `[{,]${opts.filetype}/` });
			}

			this.queryService.generateVisibilityQuery(query, me);
			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			return await query.limit(pagination.limit).getMany();
		}
	}
}
