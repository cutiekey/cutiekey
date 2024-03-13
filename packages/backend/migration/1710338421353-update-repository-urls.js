/*
 * SPDX-FileCopyrightText: Luna Nova and other Cutiekey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UpdateRepositoryUrls1710338421353 {
    name = 'UpdateRepositoryUrls1710338421353'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_q5lm0tbgejtfskzg0rc4wd7t1n"`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP CONSTRAINT "FK_605472305f26818cc93d1baaa74"`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP CONSTRAINT "FK_d844bfc6f3f523a05189076efaa"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."backgroundId" IS 'The ID of background DriveFile.'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isSilenced" IS 'Whether the User is silenced.'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."noindex" IS 'Whether the User''s notes dont get indexed.'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."speakAsCat" IS 'Whether the User speaks in nya.'`);
        await queryRunner.query(`COMMENT ON COLUMN "note"."updatedAt" IS 'The update time of the Note.'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "disableRegistration" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" SET DEFAULT 'https://github.com/cutiekey/cutiekey'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "feedbackUrl" SET DEFAULT 'https://github.com/cutiekey/cutiekey/issues/new'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{ "admin", "administrator", "root", "system", "maintainer", "host", "mod", "moderator", "owner", "superuser", "staff", "auth", "i", "me", "everyone", "all", "mention", "mentions", "example", "user", "users", "account", "accounts", "official", "help", "helps", "support", "supports", "info", "information", "informations", "announce", "announces", "announcement", "announcements", "notice", "notification", "notifications", "dev", "developer", "developers", "tech", "misskey", "cutiekey" }'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "perLocalUserUserTimelineCacheMax" SET DEFAULT '300'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "perRemoteUserUserTimelineCacheMax" SET DEFAULT '100'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "perUserHomeTimelineCacheMax" SET DEFAULT '300'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "perUserListTimelineCacheMax" SET DEFAULT '300'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "defaultLike" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_pending" ALTER COLUMN "reason" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."listenbrainz" IS 'The ListenBrainz username of the User.'`);
        await queryRunner.query(`ALTER TYPE "public"."user_profile_followersVisibility_enum" RENAME TO "user_profile_followersVisibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_followersvisibility_enum" AS ENUM('public', 'followers', 'private')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" TYPE "public"."user_profile_followersvisibility_enum" USING "followersVisibility"::"text"::"public"."user_profile_followersvisibility_enum"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" SET DEFAULT 'public'`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_followersVisibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "flash" ALTER COLUMN "visibility" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_edit" ALTER COLUMN "oldDate" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "note_edit"."oldDate" IS 'The old date from before the edit'`);
        await queryRunner.query(`CREATE INDEX "IDX_021015e6683570ae9f6b0c62be" ON "user_list_membership" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cddcaf418dc4d392ecfcca842a" ON "user_list_membership" ("userListId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e4f3094c43f2d665e6030b0337" ON "user_list_membership" ("userId", "userListId") `);
        await queryRunner.query(`CREATE INDEX "IDX_58699f75b9cf904f5f007909cb" ON "user_profile" ("birthday") `);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_eea94b046385ca7713de38630f7" FOREIGN KEY ("backgroundId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD CONSTRAINT "FK_021015e6683570ae9f6b0c62bee" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD CONSTRAINT "FK_cddcaf418dc4d392ecfcca842a7" FOREIGN KEY ("userListId") REFERENCES "user_list"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP CONSTRAINT "FK_cddcaf418dc4d392ecfcca842a7"`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP CONSTRAINT "FK_021015e6683570ae9f6b0c62bee"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_eea94b046385ca7713de38630f7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_58699f75b9cf904f5f007909cb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e4f3094c43f2d665e6030b0337"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cddcaf418dc4d392ecfcca842a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_021015e6683570ae9f6b0c62be"`);
        await queryRunner.query(`COMMENT ON COLUMN "note_edit"."oldDate" IS NULL`);
        await queryRunner.query(`ALTER TABLE "note_edit" ALTER COLUMN "oldDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flash" ALTER COLUMN "visibility" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_followersVisibility_enum_old" AS ENUM('public', 'followers', 'private')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" TYPE "public"."user_profile_followersVisibility_enum_old" USING "followersVisibility"::"text"::"public"."user_profile_followersVisibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" SET DEFAULT 'public'`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_followersvisibility_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_profile_followersVisibility_enum_old" RENAME TO "user_profile_followersVisibility_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."listenbrainz" IS 'listenbrainz username to fetch currently playing.'`);
        await queryRunner.query(`ALTER TABLE "user_pending" ALTER COLUMN "reason" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "defaultLike" SET DEFAULT '❤️'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "perUserListTimelineCacheMax" SET DEFAULT '800'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "perUserHomeTimelineCacheMax" SET DEFAULT '800'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "perRemoteUserUserTimelineCacheMax" SET DEFAULT '800'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "perLocalUserUserTimelineCacheMax" SET DEFAULT '800'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{admin,administrator,root,system,maintainer,host,mod,moderator,owner,superuser,staff,auth,i,me,everyone,all,mention,mentions,example,user,users,account,accounts,official,help,helps,support,supports,info,information,informations,announce,announces,announcement,announcements,notice,notification,notifications,dev,developer,developers,tech,misskey}'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "feedbackUrl" SET DEFAULT 'https://activitypub.software/TransFem-org/Sharkey/-/issues/new'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" SET DEFAULT 'https://activitypub.software/TransFem-org/Sharkey/'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "disableRegistration" SET DEFAULT true`);
        await queryRunner.query(`COMMENT ON COLUMN "note"."updatedAt" IS 'The updated date of the Note.'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."speakAsCat" IS 'Whether to speak as a cat if chosen.'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."noindex" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isSilenced" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."backgroundId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD CONSTRAINT "FK_d844bfc6f3f523a05189076efaa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD CONSTRAINT "FK_605472305f26818cc93d1baaa74" FOREIGN KEY ("userListId") REFERENCES "user_list"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_q5lm0tbgejtfskzg0rc4wd7t1n" FOREIGN KEY ("backgroundId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}
