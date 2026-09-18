locals {
  function_name              = "${var.project}-lambda-get-dynamodb-collections-${var.stage}-01"
  dynamodb_table_collections = "${var.project}-tbl-collections-${var.stage}"
}

module "lambda" {
  source = "sass-ecommerce/ctv-infraestructura-aws/modules/lambda"

  function_name      = local.function_name
  runtime            = "nodejs24.x"
  handler            = "index.dynamodbCollections"
  role_arn           = var.role_arn
  filename           = "${path.module}/../../get-dynamodb-collections.zip"
  source_code_hash   = filebase64sha256("${path.module}/../../get-dynamodb-collections.zip")
  log_retention_days = 7

  environment_variables = {
    STAGE                      = var.stage
    REGION                     = var.aws_region
    DYNAMODB_TABLE_COLLECTIONS = local.dynamodb_table_collections
  }

  tags = var.tags
}
