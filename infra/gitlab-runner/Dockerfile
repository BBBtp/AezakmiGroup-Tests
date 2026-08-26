FROM gitlab/gitlab-runner:v18.10.1 AS gitlab-runner

FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl git \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash gitlab-runner \
    && rm -f /home/gitlab-runner/.bash_logout

COPY --from=gitlab-runner /usr/bin/gitlab-runner /usr/bin/gitlab-runner

ENTRYPOINT ["gitlab-runner"]
CMD ["run", "--user=gitlab-runner", "--working-directory=/home/gitlab-runner"]
