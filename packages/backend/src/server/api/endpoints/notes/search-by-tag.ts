/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { safeForSql } from '@/misc/safe-for-sql.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { MetaService } from '@/core/MetaService.js';
import { CacheService } from '@/core/CacheService.js';
import { UtilityService } from '@/core/UtilityService.js';

export const meta = {
	tags: ['notes', 'hashtags'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		reply: { type: 'boolean', nullable: true, default: null },
		renote: { type: 'boolean', nullable: true, default: null },
		withFiles: {
			type: 'boolean',
			default: false,
			description: 'Only show notes that have attached files.',
		},
		poll: { type: 'boolean', nullable: true, default: null },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },

		tag: { type: 'string', minLength: 1 },
		query: {
			type: 'array',
			description: 'The outer arrays are chained with OR, the inner arrays are chained with AND.',
			items: {
				type: 'array',
				items: {
					type: 'string',
					minLength: 1,
				},
				minItems: 1,
			},
			minItems: 1,
		},
	},
	anyOf: [
		{ required: ['tag'] },
		{ required: ['query'] },
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private metaService: MetaService,
		private cacheService: CacheService,
		private utilityService: UtilityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const meta = await this.metaService.fetch(true);

			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.andWhere('note.visibility = \'public\'')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			if (!meta.enableBotTrending) query.andWhere('user.isBot = FALSE');

			this.queryService.generateVisibilityQuery(query, me);
			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			const [
				followings,
			] = me ? await Promise.all([
				this.cacheService.userFollowingsCache.fetch(me.id),
			]) : [undefined];

			try {
				if (ps.tag) {
					if (!safeForSql(normalizeForSearch(ps.tag))) throw new Error('Injection');
					query.andWhere(':tag <@ note.tags', { tag: [normalizeForSearch(ps.tag)] });
				} else {
					query.andWhere(new Brackets(qb => {
						for (const tags of ps.query!) {
							qb.orWhere(new Brackets(qb => {
								for (const tag of tags) {
									if (!safeForSql(normalizeForSearch(tag))) throw new Error('Injection');
									qb.andWhere(':tag <@ note.tags', { tag: [normalizeForSearch(tag)] });
								}
							}));
						}
					}));
				}
			} catch (e) {
				if (e === 'Injection') return [];
				throw e;
			}

			if (ps.reply != null) {
				if (ps.reply) {
					query.andWhere('note.replyId IS NOT NULL');
				} else {
					query.andWhere('note.replyId IS NULL');
				}
			}

			if (ps.renote != null) {
				if (ps.renote) {
					query.andWhere('note.renoteId IS NOT NULL');
				} else {
					query.andWhere('note.renoteId IS NULL');
				}
			}

			if (ps.withFiles) {
				query.andWhere('note.fileIds != \'{}\'');
			}

			if (ps.poll != null) {
				if (ps.poll) {
					query.andWhere('note.hasPoll = TRUE');
				} else {
					query.andWhere('note.hasPoll = FALSE');
				}
			}

			// Search notes
			let notes = await query.limit(ps.limit).getMany();

			notes = notes.filter(note => {
				if (note.user?.isSilenced && me && followings && note.userId !== me.id && !followings[note.userId]) return false;
				if (note.user?.isSuspended) return false;
				if (this.utilityService.isBlockedHost(meta.blockedHosts, note.userHost)) return false;
				if (this.utilityService.isSilencedHost(meta.silencedHosts, note.userHost)) return false;
				return true;
			});

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
