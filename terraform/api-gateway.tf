locals {
  api_name          = "${local.project}-api-products-${local.stage}"
  lambda_invoke_uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${module.get_dynamodb_products.lambda_arn}/invocations"
  api_body = templatefile("${path.module}/api-gateway.yaml", {
    api_name          = local.api_name
    lambda_invoke_uri = local.lambda_invoke_uri
  })
}

resource "aws_api_gateway_rest_api" "this" {
  name        = local.api_name
  description = "API REST para consultar productos desde DynamoDB"
  body        = local.api_body

  tags = local.tags
}

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(local.api_body)
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = local.stage

  tags = local.tags
}

resource "aws_lambda_permission" "api_gateway_get_dynamodb_products" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.get_dynamodb_products.lambda_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}
