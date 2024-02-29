# syntax=docker/dockerfile:1.4

ARG NODE_VERSION=20.11.1-bullseye

# Build assets and compile TypeScript

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION} AS native-builder

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  rm -f /etc/apt/apt.conf.d/docker-clean \
  ; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache \
  && apt-get update \
  && apt-get install -yqq --no-install-recommends \
  build-essential

RUN corepack enable

WORKDIR /cutiekey

COPY --link ["pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json", "./"]
COPY --link ["scripts", "./scripts"]
COPY --link ["packages/backend/package.json", "./packages/backend/"]
COPY --link ["packages/frontend/package.json", "./packages/frontend/"]
COPY --link ["packages/sw/package.json", "./packages/sw/"]
COPY --link ["packages/misskey-js/package.json", "./packages/misskey-js/"]
COPY --link ["packages/megalodon/package.json", "./packages/megalodon/"]
COPY --link ["packages/misskey-reversi/package.json", "./packages/misskey-reversi/"]
COPY --link ["packages/misskey-bubble-game/package.json", "./packages/misskey-bubble-game/"]

ARG NODE_ENV=production

RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
  pnpm install --aggregate-output --frozen-lockfile

COPY --link . ./

RUN git submodule update --init
RUN pnpm run build
RUN rm -rf .git/

# Build native dependencies for the target platform

FROM --platform=$TARGETPLATFORM node:${NODE_VERSION} AS target-builder

RUN apt-get update \
  && apt-get install -yqq --no-install-recommends \
  build-essential

RUN corepack enable

WORKDIR /cutiekey

COPY --link ["pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json", "./"]
COPY --link ["scripts", "./scripts"]
COPY --link ["packages/backend/package.json", "./packages/backend/"]
COPY --link ["packages/misskey-js/package.json", "./packages/misskey-js/"]
COPY --link ["packages/megalodon/package.json", "./packages/megalodon/"]
COPY --link ["packages/misskey-reversi/package.json", "./packages/misskey-reversi/"]
COPY --link ["packages/misskey-bubble-game/package.json", "./packages/misskey-bubble-game/"]

ARG NODE_ENV=production

RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
  pnpm install --aggregate-output --frozen-lockfile

FROM --platform=$TARGETPLATFORM node:${NODE_VERSION}-slim AS runner

ARG GID="991"
ARG UID="991"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  ffmpeg tini curl libjemalloc-dev libjemalloc2 \
  && ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc2.so.2 /usr/local/lib/libjemalloc.so \
  && corepack enable \
  && groupadd -g "${GID}" cutiekey \
  && useradd -l -u "${UID}" -g "${GID}" -m -d /cutiekey cutiekey \
  && find / -type d -path /sys -prune -o -type d -path /proc -prune -o -type f -perm /u+s -ignore_readdir_race -exec chmod u-s {} \; \
  && find / -type d -path /sys -prune -o -type d -path /proc -prune -o -type f -perm /g+s -ignore_readdir_race -exec chmod g-s {} \; \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists

USER cutiekey
WORKDIR /cutiekey

COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/node_modules ./node_modules
COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/packages/backend/node_modules ./packages/backend/node_modules
COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/packages/misskey-js/node_modules ./packages/misskey-js/node_modules
COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/packages/megalodon/node_modules ./packages/megalodon/node_modules
COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/packages/misskey-reversi/node_modules ./packages/misskey-reversi/node_modules
COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/packages/misskey-bubble-game/node_modules ./packages/misskey-bubble-game/node_modules
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/built ./built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/misskey-js/built ./packages/misskey-js/built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/megalodon/lib ./packages/megalodon/lib
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/misskey-reversi/built ./packages/misskey-reversi/built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/misskey-bubble-game/built ./packages/misskey-bubble-game/built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/backend/built ./packages/backend/built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/fluent-emojis /cutiekey/fluent-emojis
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/tossface-emojis /cutiekey/tossface-emojis
COPY --chown=cutiekey:cutiekey . ./

ENV LD_PRELOAD=/usr/local/lib/libjemalloc.so
ENV NODE_ENV=production

HEALTHCHECK --interval=5s --retries=20 CMD ["/bin/bash", "/cutiekey/healthcheck.sh"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "run", "migrateandstart"]
