module "trigger_post_confirmation" {
  source = "./trigger-post-confirmation"

  project               = local.project
  cognito_user_pool_arn = tolist(data.aws_cognito_user_pools.this.arns)[0]
  role_arn              = data.aws_ssm_parameter.lambda_role_arn.value
  backend_url           = local.backend_urls[local.stage]
  stage                 = local.stage
  tags                  = local.tags
}

module "trigger_pre_token" {
  source = "./trigger-pre-token"

  project               = local.project
  cognito_user_pool_arn = tolist(data.aws_cognito_user_pools.this.arns)[0]
  role_arn              = data.aws_ssm_parameter.lambda_role_arn.value
  stage                 = local.stage
  tags                  = local.tags
}

module "trigger_pre_signup" {
  source = "./trigger-pre-signup"

  project               = local.project
  cognito_user_pool_arn = tolist(data.aws_cognito_user_pools.this.arns)[0]
  role_arn              = data.aws_ssm_parameter.lambda_role_arn.value
  stage                 = local.stage
  tags                  = local.tags
}

module "trigger_post_authentication" {
  source = "./trigger-post-authentication"

  project               = local.project
  cognito_user_pool_arn = tolist(data.aws_cognito_user_pools.this.arns)[0]
  role_arn              = data.aws_ssm_parameter.lambda_role_arn.value
  backend_url           = local.backend_urls[local.stage]
  stage                 = local.stage
  tags                  = local.tags
}

module "trigger_products_upload" {
  source = "./trigger-products-upload"

  project    = local.project
  role_arn   = data.aws_ssm_parameter.lambda_role_arn.value
  stage      = local.stage
  aws_region = var.aws_region
  tags       = local.tags
}

module "event_rule_products" {
  source = "./event-rule-products"

  project    = local.project
  role_arn   = data.aws_ssm_parameter.lambda_role_arn.value
  stage      = local.stage
  aws_region = var.aws_region
  tags       = local.tags
}

module "get_dynamodb_products" {
  source = "./get-dynamodb-products"

  project    = local.project
  role_arn   = data.aws_ssm_parameter.lambda_role_arn.value
  stage      = local.stage
  aws_region = var.aws_region
  tags       = local.tags
}
