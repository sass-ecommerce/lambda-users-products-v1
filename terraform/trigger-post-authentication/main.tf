locals {
  function_name = "${var.project}-lambda-trigger-post-authentication-${var.stage}-01"
}

module "lambda" {
  source = "sass-ecommerce/ctv-infraestructura-aws/modules/lambda"

  function_name      = local.function_name
  runtime            = "nodejs24.x"
  handler            = "index.postAuthentication"
  role_arn           = var.role_arn
  filename           = "${path.module}/../../trigger-post-authentication.zip"
  source_code_hash   = filebase64sha256("${path.module}/../../trigger-post-authentication.zip")
  log_retention_days = 7

  environment_variables = {
    STAGE       = var.stage
    BACKEND_URL = var.backend_url
  }

  permissions = {
    allow_cognito = {
      action     = "lambda:InvokeFunction"
      principal  = "cognito-idp.amazonaws.com"
      source_arn = var.cognito_user_pool_arn
    }
  }

  tags = var.tags
}
