FROM --platform=$BUILDPLATFORM node:18.3.0-alpine3.16 AS client-builder

WORKDIR /ui

# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json

RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci

# install
COPY ui /ui
RUN npm run build

FROM alpine
LABEL org.opencontainers.image.title="Envoy Gateway" \
    org.opencontainers.image.description="This is a Envoy Gateway Extension that shows how to interact with Envoy Gateway on Kubernetes." \
    org.opencontainers.image.vendor="Saptak Sen" \
    org.opencontainers.image.licenses="Apache-2.0" \
    com.docker.desktop.extension.icon="" \
    com.docker.desktop.extension.api.version=">= 0.2.3" \
    com.docker.extension.screenshots="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.changelog=""

RUN apk add curl tar gzip unzip

# Download and install kubectl
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl \
    && chmod +x ./kubectl && mv ./kubectl /usr/local/bin/kubectl \
    && mkdir /linux \
    && cp /usr/local/bin/kubectl /linux/

RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl" \
    && mkdir /darwin \
    && chmod +x ./kubectl && mv ./kubectl /darwin/

RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/windows/amd64/kubectl.exe" \
    && mkdir /windows \
    && chmod +x ./kubectl.exe && mv ./kubectl.exe /windows/

# Download and install helm v3.18.0
RUN HELM_VERSION=v3.18.0 && \
    # Linux AMD64 \
    curl -LO https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz && \
    tar -zxvf helm-${HELM_VERSION}-linux-amd64.tar.gz linux-amd64/helm && \
    mv linux-amd64/helm /linux/helm && \
    rm helm-${HELM_VERSION}-linux-amd64.tar.gz && rm -rf linux-amd64 && \
    # Linux ARM64 \
    curl -LO https://get.helm.sh/helm-${HELM_VERSION}-linux-arm64.tar.gz && \
    tar -zxvf helm-${HELM_VERSION}-linux-arm64.tar.gz linux-arm64/helm && \
    mv linux-arm64/helm /linux/helm-arm64 && \
    rm helm-${HELM_VERSION}-linux-arm64.tar.gz && rm -rf linux-arm64 && \
    # Darwin AMD64 \
    curl -LO https://get.helm.sh/helm-${HELM_VERSION}-darwin-amd64.tar.gz && \
    tar -zxvf helm-${HELM_VERSION}-darwin-amd64.tar.gz darwin-amd64/helm && \
    mv darwin-amd64/helm /darwin/helm && \
    rm helm-${HELM_VERSION}-darwin-amd64.tar.gz && rm -rf darwin-amd64 && \
    # Darwin ARM64 \
    curl -LO https://get.helm.sh/helm-${HELM_VERSION}-darwin-arm64.tar.gz && \
    tar -zxvf helm-${HELM_VERSION}-darwin-arm64.tar.gz darwin-arm64/helm && \
    mv darwin-arm64/helm /darwin/helm-arm64 && \
    rm helm-${HELM_VERSION}-darwin-arm64.tar.gz && rm -rf darwin-arm64 && \
    # Windows AMD64 \
    curl -LO https://get.helm.sh/helm-${HELM_VERSION}-windows-amd64.zip && \
    unzip helm-${HELM_VERSION}-windows-amd64.zip -d /windows && \
    mv /windows/windows-amd64/helm.exe /windows/helm.exe && \
    rm -rf /windows/windows-amd64 && \
    rm helm-${HELM_VERSION}-windows-amd64.zip && \
    # Windows ARM64 \
    curl -LO https://get.helm.sh/helm-${HELM_VERSION}-windows-arm64.zip && \
    unzip helm-${HELM_VERSION}-windows-arm64.zip -d /windows && \
    mv /windows/windows-arm64/helm.exe /windows/helm-arm64.exe && \
    rm -rf /windows/windows-arm64 && \
    rm helm-${HELM_VERSION}-windows-arm64.zip

COPY metadata.json .
COPY docker.svg .
COPY --from=client-builder /ui/build ui
