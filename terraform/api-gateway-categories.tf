locals {
  categories_api_name          = "${local.project}-api-categories-${local.stage}"
  categories_lambda_invoke_uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${module.get_dynamodb_categories.lambda_arn}/invocations"
  categories_api_body = templatefile("${path.module}/api-gateway-categories.yaml", {
    api_name          = local.categories_api_name
    lambda_invoke_uri = local.categories_lambda_invoke_uri
  })
}

resource "aws_api_gateway_rest_api" "categories" {
  name        = local.categories_api_name
  description = "API REST para consultar categorías desde DynamoDB"
  body        = local.categories_api_body

  tags = local.tags
}

resource "aws_api_gateway_deployment" "categories" {
  rest_api_id = aws_api_gateway_rest_api.categories.id

  triggers = {
    redeployment = sha1(local.categories_api_body)
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "categories" {
  deployment_id = aws_api_gateway_deployment.categories.id
  rest_api_id   = aws_api_gateway_rest_api.categories.id
  stage_name    = local.stage

  tags = local.tags
}

resource "aws_lambda_permission" "api_gateway_get_dynamodb_categories" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.get_dynamodb_categories.lambda_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.categories.execution_arn}/*/*"
}
