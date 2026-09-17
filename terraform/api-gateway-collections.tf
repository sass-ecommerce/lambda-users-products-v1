locals {
  collections_api_name          = "${local.project}-api-collections-${local.stage}"
  collections_lambda_invoke_uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${module.get_dynamodb_collections.lambda_arn}/invocations"
  collections_api_body = templatefile("${path.module}/api-gateway-collections.yaml", {
    api_name          = local.collections_api_name
    lambda_invoke_uri = local.collections_lambda_invoke_uri
  })
}

resource "aws_api_gateway_rest_api" "collections" {
  name        = local.collections_api_name
  description = "API REST para consultar colecciones desde DynamoDB"
  body        = local.collections_api_body

  tags = local.tags
}

resource "aws_api_gateway_deployment" "collections" {
  rest_api_id = aws_api_gateway_rest_api.collections.id

  triggers = {
    redeployment = sha1(local.collections_api_body)
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "collections" {
  deployment_id = aws_api_gateway_deployment.collections.id
  rest_api_id   = aws_api_gateway_rest_api.collections.id
  stage_name    = local.stage

  tags = local.tags
}

resource "aws_lambda_permission" "api_gateway_get_dynamodb_collections" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.get_dynamodb_collections.lambda_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.collections.execution_arn}/*/*"
}
