# DROPi — Deployment

## 1. Model de deployment

Deployment-ul curent este cloud-first:
- backend în cloud
- build/update mobil prin EAS
- orchestrare prin GitHub Actions

## 2. Principii

1. Fără dependență de localhost pentru runtime mobil real.
2. Configurarea mediului prin variabile de mediu/secrete.
3. Build-urile mobile sunt versionate automat în CI.

## 3. Componente de deployment

- `eas.json` (profile build + env forwarding)
- `app.config.ts` (config Expo/EAS)
- `.github/workflows/eas-build-android.yml`
- `.github/workflows/eas-update.yml`
- `railway.toml` (infrastructură backend)

## 4. Referințe operative

- `docs/MOBILE_FIRST_SETUP.md`
- `docs/BLUEPRINT_INDEPENDENT_DEPLOYMENT.md`
- `canonical/SESSION_HANDOVER.md`
- `04.zip` → `04/DROPI_CANONICAL/09_DEPLOYMENT/DEPLOYMENT_GUIDE.md`

