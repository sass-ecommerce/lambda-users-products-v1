data "aws_ssm_parameter" "rule_products_arn" {
  name = "/${var.stage}/${var.project}/eventbridge/rule-products-arn"
}

locals {
  function_name           = "${var.project}-lambda-event-rule-products-${var.stage}-01"
  rule_name               = "${var.project}-rule-products-${var.stage}"
  event_bus_name          = "${var.project}-event-bus-${var.stage}"
  dynamodb_table_products = "${var.project}-tbl-products-${var.stage}"
}

module "lambda" {
  source = "sass-ecommerce/ctv-infraestructura-aws/modules/lambda"

  function_name      = local.function_name
  runtime            = "nodejs24.x"
  handler            = "index.eventBridgeProducts"
  role_arn           = var.role_arn
  filename           = "${path.module}/../../event-rule-products.zip"
  source_code_hash   = filebase64sha256("${path.module}/../../event-rule-products.zip")
  log_retention_days = 7

  environment_variables = {
    STAGE                   = var.stage
    REGION                  = var.aws_region
    DYNAMODB_TABLE_PRODUCTS = local.dynamodb_table_products
  }

  permissions = {
    allow_eventbridge = {
      action     = "lambda:InvokeFunction"
      principal  = "events.amazonaws.com"
      source_arn = data.aws_ssm_parameter.rule_products_arn.value
    }
  }

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "this" {
  rule           = local.rule_name
  event_bus_name = local.event_bus_name
  arn            = module.lambda.function_arn
}
