# syntax=docker/dockerfile:1

###################
# Base stage
###################
FROM node:20-alpine AS base

WORKDIR /app

# Зависимости (максимальный кэш)
COPY package.json package-lock.json ./
RUN npm ci

# Исходники
COPY . .

# Env приходит извне и используется как в prod build,
# так и при запуске dev server внутри контейнера.
ARG VITE_API_URL
ARG VITE_MAPBOX_ACCESS_TOKEN
ARG VITE_MAPBOX_STYLE
ARG VITE_MAPBOX_DEFAULT_CENTER_LAT
ARG VITE_MAPBOX_DEFAULT_CENTER_LNG
ARG VITE_MAPBOX_DEFAULT_ZOOM
ARG VITE_MAPBOX_MIN_ZOOM
ARG VITE_MAPBOX_MAX_ZOOM

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_MAPBOX_STYLE=$VITE_MAPBOX_STYLE
ENV VITE_MAPBOX_DEFAULT_CENTER_LAT=$VITE_MAPBOX_DEFAULT_CENTER_LAT
ENV VITE_MAPBOX_DEFAULT_CENTER_LNG=$VITE_MAPBOX_DEFAULT_CENTER_LNG
ENV VITE_MAPBOX_DEFAULT_ZOOM=$VITE_MAPBOX_DEFAULT_ZOOM
ENV VITE_MAPBOX_MIN_ZOOM=$VITE_MAPBOX_MIN_ZOOM
ENV VITE_MAPBOX_MAX_ZOOM=$VITE_MAPBOX_MAX_ZOOM

###################
# Build stage
###################
FROM base AS build

RUN npm run build

###################
# Production stage
###################
FROM nginx:alpine AS production

# Чистим дефолт
RUN rm -rf /usr/share/nginx/html/*

# Копируем билд
COPY --from=build /app/dist /usr/share/nginx/html

# Свой nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

###################
# Development stage
###################
FROM base AS development

ENV HOST=0.0.0.0
ENV PORT=4174

EXPOSE 4174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4174"]
