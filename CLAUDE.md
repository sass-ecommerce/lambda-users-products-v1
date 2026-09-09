# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

AWS Lambda monorepo hosting four Cognito/S3 triggers, using Serverless Framework v4, TypeScript, and Node.js 24. Each Lambda lives in its own `src/<name>/` directory.

## Commands

```bash
# Install dependencies
npm install

# Local development (serverless-offline)
npm run dev   # http://localhost:3000

# Type check
npm run typecheck

# Lint / format
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Tests
npm test
npm run test:watch

# Build for Terraform deploy (outputs to .build/<name>/)
npm run build

# Package each .build/<name>/ into <name>.zip for Terraform upload
npm run package

# Deploy via Serverless Framework (not the primary deploy path)
serverless deploy --stage dev   # or staging / prod
```

## Architecture

Four Lambda functions, each isolated under its own `src/<name>/` directory:

| Function             | Trigger                         | Purpose                                                                                                                                                                                           |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pre-signup`         | Cognito Pre Sign-up             | Links a Google sign-in to an existing native (email/password) user with the same email via `AdminLinkProviderForUser`; rejects native sign-up when the email already belongs to a Google identity |
| `post-confirmation`  | Cognito Post Confirmation       | Forwards new user data to the backend at `POST /api/users/cognito-trigger`                                                                                                                        |
| `pre-token`          | Cognito Pre Token Generation V2 | Injects `custom:id` and `custom:tenantId` as `id`/`tenantId` claims into the access token                                                                                                         |
| `s3-products-upload` | S3 PUT event                    | Notifies the backend at `POST /api/products/images` when a product image is uploaded; S3 key format: `{tenantId}/products/{productId}/{filename}`                                                 |

Each function follows the same two-file pattern:

- `src/<name>/<name>.controller.ts` — Lambda handler entry; receives the AWS event type and delegates to the service (for post-confirmation) or handles logic directly (for pre-token and s3-products-upload)
- `src/<name>/index.ts` — re-exports the handler; this is what `config/functions.yml` and `esbuild.config.js` reference

Other key files:

- **`config/functions.yml`** — all Lambda function declarations (handler path + HTTP event for local dev); imported by `serverless.yml`
- **`config/dev.yml`** — environment variables for local dev (`STAGE`, `BACKEND_URL`); injected via `provider.environment`
- **`esbuild.config.js`** — auto-discovers entry points by reading `src/` subdirectories; outputs minified bundles to `.build/<name>/index.js`
- **`serverless.yml`** — provider config; service `user-post-confirmation`, runtime `nodejs24.x`; esbuild bundles TypeScript with `@aws-sdk/*` excluded

## Terraform infrastructure

The `terraform/` directory manages the AWS resources. The primary deploy path for production is Terraform (not `serverless deploy`):

- **`terraform/main.tf`** — root module; instantiates child modules: `pre-signup`, `post-confirmation`, `pre-token`, `s3-products-upload`
- **`terraform/cognito.tf`** — imports the existing Cognito user pool (via `data.aws_cognito_user_pools`) and wires the three Cognito Lambda triggers; uses `lifecycle.ignore_changes` to avoid conflicts with console-managed pool settings
- **`terraform/locals.tf`** — maps stage names (`dev`/`staging`/`prod`) to backend Railway URLs
- **`terraform/<module>/`** — each child module defines the Lambda function resource, IAM permission for Cognito/S3 to invoke it, and any event source mappings

Lambda role ARN is read from SSM (`data.aws_ssm_parameter.lambda_role_arn`).

## Key conventions

- All source files go under `src/`
- Tests live under `test/` and must match `**/*.test.ts`
- Prefix unused Lambda parameters with `_` (e.g. `_event`) to satisfy TypeScript strict mode
- Adding a new Lambda: create `src/<name>/index.ts` + handler file, add an entry to `config/functions.yml`, and add a new Terraform child module under `terraform/<name>/`
- Stage is set via `--stage` flag (Serverless) or `var.environment` (Terraform); defaults to `dev`
