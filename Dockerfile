ARG NODE_VERSION=20.11.0-bullseye

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

COPY --link ["yarn.lock", "package.json", "./"]
COPY --link ["scripts", "./scripts"]
COPY --link ["packages/backend/package.json", "./packages/backend/"]
COPY --link ["packages/cutiekey.js/package.json", "./packages/cutiekey.js/"]
COPY --link ["packages/cutiekey-bubble-game/package.json", "./packages/cutiekey-bubble-game/"]
COPY --link ["packages/cutiekey-reversi/package.json", "./packages/cutiekey-reversi/"]
COPY --link ["packages/frontend/package.json", './packages/frontend/']
COPY --link ["packages/sw/package.json", "./packages/sw/"]

RUN --mount=type=cache,target=/cutiekey/node_modules/.store,sharing=locked \
  yarn install --frozen-lockfile

COPY --link . ./

ARG NODE_ENV=production

RUN git submodule update --init
RUN yarn build
RUN rm -rf .git

# Build native dependencies for target platform

FROM --platform=$TARGETPLATFORM node:${NODE_VERSION} AS target-builder

RUN apt-get update \
  && apt-get install -yqq --no-install-recommends \
  build-essential

RUN corepack enable

WORKDIR /cutiekey

COPY --link ["yarn.lock", "package.json", "./"]
COPY --link ["scripts", "./scripts"]
COPY --link ["packages/backend/package.json", "./packages/backend/"]
COPY --link ["packages/cutiekey.js/package.json", "./packages/cutiekey.js/"]
COPY --link ["packages/cutiekey-bubble-game/package.json", "./packages/cutiekey-bubble-game/"]
COPY --link ["packages/cutiekey-reversi/package.json", "./packages/cutiekey-reversi/"]
COPY --link ["packages/frontend/package.json", './packages/frontend/']
COPY --link ["packages/sw/package.json", "./packages/sw/"]

RUN --mount=type=cache,target=/cutiekey/node_modules/.store,sharing=locked \
  yarn install --frozen-lockfile

FROM --platform=$TARGETPLATFORM node:${NODE_VERSION}-slim AS runner

ARG UID="991"
ARG GID="991"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  ffmpeg tini curl libjemalloc-dev libjemalloc2 \
  && ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so \
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
COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/packages/cutiekey.js/node_modules ./packages/cutiekey.js/node_modules
COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/packages/cutiekey-bubble-game/node_modules ./packages/cutiekey-bubble-game/node_modules
COPY --chown=cutiekey:cutiekey --from=target-builder /cutiekey/packages/cutiekey-reversi/node_modules ./packages/cutiekey-reversi/node_modules

COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/built ./built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/fluent-emojis /cutiekey/fluent-emojis
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/backend/built ./packages/backend/built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/cutiekey.js/built ./packages/cutiekey.js/built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/cutiekey-bubble-game/built ./packages/cutiekey-bubble-game/built
COPY --chown=cutiekey:cutiekey --from=native-builder /cutiekey/packages/cutiekey-reversi/built ./packages/cutiekey-reversi/built

COPY --chown=cutiekey:cutiekey . ./

ENV LD_PRELOAD=/usr/local/lib/libjemalloc.so
ENV NODE_ENV=production
HEALTHCHECK --interval=5s --retries=20 CMD ["/bin/bash", "/cutiekey/healthcheck.sh"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["yarn", "migrate:start"]
