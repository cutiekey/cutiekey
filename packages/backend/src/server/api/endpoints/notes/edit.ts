import ms from 'ms';
import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { MiUser } from '@/models/User.js';
import type { UsersRepository, NotesRepository, BlockingsRepository, DriveFilesRepository, ChannelsRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiNote } from '@/models/Note.js';
import type { MiChannel } from '@/models/Channel.js';
import type { Config } from '@/config.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { NoteEditService } from '@/core/NoteEditService.js';
import { DI } from '@/di-symbols.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	kind: 'write:notes',

	res: {
		type: 'object',
		optional: false,
		nullable: false,
		properties: {
			createdNote: {
				type: 'object',
				optional: false,
				nullable: false,
				ref: 'Note',
			},
		},
	},

	errors: {
		noSuchRenoteTarget: {
			message: 'No such renote target.',
			code: 'NO_SUCH_RENOTE_TARGET',
			id: 'b5c90186-4ab0-49c8-9bba-a1f76c282ba4',
		},

		cannotReRenote: {
			message: 'You can not Renote a pure Renote.',
			code: 'CANNOT_RENOTE_TO_A_PURE_RENOTE',
			id: 'fd4cc33e-2a37-48dd-99cc-9b806eb2031a',
		},

		noSuchReplyTarget: {
			message: 'No such reply target.',
			code: 'NO_SUCH_REPLY_TARGET',
			id: '749ee0f6-d3da-459a-bf02-282e2da4292c',
		},

		cannotReplyToPureRenote: {
			message: 'You can not reply to a pure Renote.',
			code: 'CANNOT_REPLY_TO_A_PURE_RENOTE',
			id: '3ac74a84-8fd5-4bb0-870f-01804f82ce15',
		},

		cannotCreateAlreadyExpiredPoll: {
			message: 'Poll is already expired.',
			code: 'CANNOT_CREATE_ALREADY_EXPIRED_POLL',
			id: '04da457d-b083-4055-9082-955525eda5a5',
		},

		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'b1653923-5453-4edc-b786-7c4f39bb0bbb',
		},

		youHaveBeenBlocked: {
			message: 'You have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: 'b390d7e1-8a5e-46ed-b625-06271cafd3d3',
		},

		accountLocked: {
			message: 'You migrated. Your account is now locked.',
			code: 'ACCOUNT_LOCKED',
			id: 'd390d7e1-8a5e-46ed-b625-06271cafd3d3',
		},

		needsEditId: {
			message: 'You need to specify `editId`.',
			code: 'NEEDS_EDIT_ID',
			id: 'd697edc8-8c73-4de8-bded-35fd198b79e5',
		},

		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'eef6c173-3010-4a23-8674-7c4fcaeba719',
		},

		youAreNotTheAuthor: {
			message: 'You are not the author of this note.',
			code: 'YOU_ARE_NOT_THE_AUTHOR',
			id: 'c6e61685-411d-43d0-b90a-a448d2539001',
		},

		cannotPrivateRenote: {
			message: 'You can not perform a private renote.',
			code: 'CANNOT_PRIVATE_RENOTE',
			id: '19a50f1c-84fa-4e33-81d3-17834ccc0ad8',
		},

		notLocalUser: {
			message: 'You are not a local user.',
			code: 'NOT_LOCAL_USER',
			id: 'b907f407-2aa0-4283-800b-a2c56290b822',
		},

		cannotRenoteOutsideOfChannel: {
			message: 'Cannot renote outside of channel.',
			code: 'CANNOT_RENOTE_OUTSIDE_OF_CHANNEL',
			id: '33510210-8452-094c-6227-4a6c05d99f00',
		},

		cannotQuoteaQuoteOfCurrentPost: {
			message: 'Cannot quote a quote of edited note.',
			code: 'CANNOT_QUOTE_A_QUOTE_OF_EDITED_NOTE',
			id: '33510210-8452-094c-6227-4a6c05d99f01',
		},

		cannotQuoteCurrentPost: {
			message: 'Cannot quote the current note.',
			code: 'CANNOT_QUOTE_THE_CURRENT_NOTE',
			id: '33510210-8452-094c-6227-4a6c05d99f02',
		},

		maxLength: {
			message: 'You tried posting a note which is too long.',
			code: 'MAX_LENGTH',
			id: '3ac74a84-8fd5-4bb0-870f-01804f82ce16',
		},

		containsProhibitedWords: {
			message: 'Cannot post because it contains prohibited words.',
			code: 'CONTAINS_PROHIBITED_WORDS',
			id: 'aa6e01d3-a85c-669d-758a-76aab43af334',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		editId: { type: 'string', format: 'misskey:id' },
		visibility: { type: 'string', enum: ['public', 'home', 'followers', 'specified'], default: 'public' },
		visibleUserIds: {
			type: 'array',
			uniqueItems: true,
			items: {
				type: 'string',
				format: 'misskey:id',
			},
		},
		cw: { type: 'string', nullable: true, minLength: 1, maxLength: 500 },
		localOnly: { type: 'boolean', default: false },
		reactionAcceptance: { type: 'string', nullable: true, enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'], default: null },
		noExtractMentions: { type: 'boolean', default: false },
		noExtractHashtags: { type: 'boolean', default: false },
		noExtractEmojis: { type: 'boolean', default: false },
		replyId: { type: 'string', format: 'misskey:id', nullable: true },
		renoteId: { type: 'string', format: 'misskey:id', nullable: true },
		channelId: { type: 'string', format: 'misskey:id', nullable: true },
		text: {
			type: 'string',
			minLength: 1,
			nullable: true,
		},
		fileIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		mediaIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		poll: {
			type: 'object',
			nullable: true,
			properties: {
				choices: {
					type: 'array',
					uniqueItems: true,
					minItems: 2,
					maxItems: 10,
					items: { type: 'string', minLength: 1, maxLength: 50 },
				},
				multiple: { type: 'boolean' },
				expiresAt: { type: 'integer', nullable: true },
				expiredAfter: { type: 'integer', nullable: true, minimum: 1 },
			},
			required: ['choices'],
		},
	},
	anyOf: [
		{
			// (re)note with text, files and poll are optional
			properties: {
				text: {
					type: 'string',
					minLength: 1,
					nullable: false,
				},
			},
			required: ['text'],
		},
		{
			// (re)note with files, text and poll are optional
			required: ['fileIds'],
		},
		{
			// (re)note with files, text and poll are optional
			required: ['mediaIds'],
		},
		{
			// (re)note with poll, text and files are optional
			properties: {
				poll: { type: 'object', nullable: false },
			},
			required: ['poll'],
		},
		{
			// pure renote
			required: ['renoteId'],
		},
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private noteEntityService: NoteEntityService,
		private noteEditService: NoteEditService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.text && (ps.text.length > this.config.maxNoteLength)) {
				throw new ApiError(meta.errors.maxLength);
			}
			let visibleUsers: MiUser[] = [];
			if (ps.visibleUserIds) {
				visibleUsers = await this.usersRepository.findBy({
					id: In(ps.visibleUserIds),
				});
			}

			let files: MiDriveFile[] = [];
			const fileIds = ps.fileIds ?? ps.mediaIds ?? null;
			if (fileIds != null) {
				files = await this.driveFilesRepository.createQueryBuilder('file')
					.where('file.userId = :userId AND file.id IN (:...fileIds)', {
						userId: me.id,
						fileIds,
					})
					.orderBy('array_position(ARRAY[:...fileIds], "id"::text)')
					.setParameters({ fileIds })
					.getMany();

				if (files.length !== fileIds.length) {
					throw new ApiError(meta.errors.noSuchNote);
				}
			}

			let renote: MiNote | null = null;

			if (ps.renoteId === ps.editId) {
				throw new ApiError(meta.errors.cannotQuoteCurrentPost);
			}
			
			if (ps.renoteId != null) {
				// Fetch renote to note
				renote = await this.notesRepository.findOneBy({ id: ps.renoteId });

				if (renote == null) {
					throw new ApiError(meta.errors.noSuchRenoteTarget);
				} else if (renote.renoteId && !renote.text && !renote.fileIds && !renote.hasPoll) {
					throw new ApiError(meta.errors.cannotReRenote);
				}

				if (renote.renoteId === ps.editId) {
					throw new ApiError(meta.errors.cannotQuoteaQuoteOfCurrentPost);
				}

				// Check blocking
				if (renote.userId !== me.id) {
					const blockExist = await this.blockingsRepository.exists({
						where: {
							blockerId: renote.userId,
							blockeeId: me.id,
						},
					});
					if (blockExist) {
						throw new ApiError(meta.errors.youHaveBeenBlocked);
					}
				}

				if (renote.channelId && renote.channelId !== ps.channelId) {
					// チャンネルのノートに対しリノート要求がきたとき、チャンネル外へのリノート可否をチェック
					// リノートのユースケースのうち、チャンネル内→チャンネル外は少数だと考えられるため、JOINはせず必要な時に都度取得する
					const renoteChannel = await this.channelsRepository.findOneById(renote.channelId);
					if (renoteChannel == null) {
						// リノートしたいノートが書き込まれているチャンネルが無い
						throw new ApiError(meta.errors.noSuchChannel);
					} else if (!renoteChannel.allowRenoteToExternal) {
						// リノート作成のリクエストだが、対象チャンネルがリノート禁止だった場合
						throw new ApiError(meta.errors.cannotRenoteOutsideOfChannel);
					}
				}
			}

			let reply: MiNote | null = null;
			if (ps.replyId != null) {
				// Fetch reply
				reply = await this.notesRepository.findOneBy({ id: ps.replyId });

				if (reply == null) {
					throw new ApiError(meta.errors.noSuchReplyTarget);
				} else if (reply.renoteId && !reply.text && !reply.fileIds && !reply.hasPoll) {
					throw new ApiError(meta.errors.cannotReplyToPureRenote);
				}

				// Check blocking
				if (reply.userId !== me.id) {
					const blockExist = await this.blockingsRepository.exists({
						where: {
							blockerId: reply.userId,
							blockeeId: me.id,
						},
					});
					if (blockExist) {
						throw new ApiError(meta.errors.youHaveBeenBlocked);
					}
				}
			}

			if (ps.poll) {
				if (typeof ps.poll.expiresAt === 'number') {
					if (ps.poll.expiresAt < Date.now()) {
						throw new ApiError(meta.errors.cannotCreateAlreadyExpiredPoll);
					}
				} else if (typeof ps.poll.expiredAfter === 'number') {
					ps.poll.expiresAt = Date.now() + ps.poll.expiredAfter;
				}
			}

			let channel: MiChannel | null = null;
			if (ps.channelId != null) {
				channel = await this.channelsRepository.findOneBy({ id: ps.channelId, isArchived: false });

				if (channel == null) {
					throw new ApiError(meta.errors.noSuchChannel);
				}
			}
			try {
				// 投稿を作成
				const note = await this.noteEditService.edit(me, ps.editId!, {
					files: files,
					poll: ps.poll ? {
						choices: ps.poll.choices,
						multiple: ps.poll.multiple ?? false,
						expiresAt: ps.poll.expiresAt ? new Date(ps.poll.expiresAt) : null,
					} : undefined,
					text: ps.text ?? undefined,
					reply,
					renote,
					cw: ps.cw,
					localOnly: ps.localOnly,
					reactionAcceptance: ps.reactionAcceptance,
					visibility: ps.visibility,
					visibleUsers,
					channel,
					apMentions: ps.noExtractMentions ? [] : undefined,
					apHashtags: ps.noExtractHashtags ? [] : undefined,
					apEmojis: ps.noExtractEmojis ? [] : undefined,
				});

				return {
					createdNote: await this.noteEntityService.pack(note, me),
				};
			} catch (e) {
				// TODO: 他のErrorもここでキャッチしてエラーメッセージを当てるようにしたい
				if (e instanceof IdentifiableError) {
					if (e.id === '689ee33f-f97c-479a-ac49-1b9f8140af99') throw new ApiError(meta.errors.containsProhibitedWords);
				}

				throw e;
			}
		});
	}
}
