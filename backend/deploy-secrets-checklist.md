# Deploy Config Checklist

## Что произошло

Деплой остановился не из-за кода в workflow, а из-за отсутствующих GitHub Actions переменных для SSH-подключения.

Текущая ошибка:

```text
SERVER_IP is empty. Set it in environment secrets or vars.
```

Это означает, что для текущего environment не задан `SERVER_IP`.

## Что нужно настроить в GitHub

Открыть:

- `Settings -> Environments -> production` для ветки `main`
- `Settings -> Environments -> development` для ветки `dev`

И добавить следующие значения.

### Secrets

- `SSH_KEY` — приватный SSH-ключ для подключения к серверу
- `SERVER_IP` — IP-адрес сервера
- `SERVER_USER` — пользователь для SSH
- `SUPERADMIN_PASSWORD` — пароль суперпользователя

### Variables

- `DEPLOY_DIR` — директория проекта на сервере, например `/opt/mapa`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_USERNAME`

## Минимально обязательные значения для деплоя

- `SERVER_IP`
- `SERVER_USER`
- `SSH_KEY`
- `DEPLOY_DIR`

## Что уже сделано в workflow

В workflow добавлена ранняя проверка deploy-конфига, поэтому теперь при отсутствии обязательных переменных GitHub Actions сразу показывает понятную ошибку, а не падает позже на SSH-шаге.
