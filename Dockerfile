FROM mcr.microsoft.com/playwright:v1.64.1-noble
WORKDIR /app
ENV CI=1
COPY package.json package-lock.json ./
RUN npm ci && node -e "if (require('@playwright/test/package.json').version !== '1.64.1') throw new Error('Update Dockerfile to match package-lock.json')"
COPY app ./app
COPY tests ./tests
COPY pages ./pages
COPY fixtures ./fixtures
COPY playwright.config.ts tsconfig.json ./
CMD ["npm", "run", "test:all"]
