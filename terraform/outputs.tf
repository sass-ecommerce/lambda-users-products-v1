output "trigger_post_confirmation_lambda_name" {
  description = "Nombre de la Lambda trigger-post-confirmation"
  value       = module.trigger_post_confirmation.lambda_name
}

output "trigger_pre_token_lambda_name" {
  description = "Nombre de la Lambda trigger-pre-token"
  value       = module.trigger_pre_token.lambda_name
}

output "trigger_pre_signup_lambda_name" {
  description = "Nombre de la Lambda trigger-pre-signup"
  value       = module.trigger_pre_signup.lambda_name
}

output "trigger_products_upload_lambda_name" {
  description = "Nombre de la Lambda trigger-products-upload"
  value       = module.trigger_products_upload.lambda_name
}

output "event_rule_products_lambda_name" {
  description = "Nombre de la Lambda event-rule-products"
  value       = module.event_rule_products.lambda_name
}

output "event_rule_products_rule_arn" {
  description = "ARN del EventBridge Rule de products"
  value       = module.event_rule_products.event_rule_arn
  sensitive   = true
}

output "get_dynamodb_products_lambda_name" {
  description = "Nombre de la Lambda get-dynamodb-products"
  value       = module.get_dynamodb_products.lambda_name
}

output "api_products_url" {
  description = "URL base del API REST de productos"
  value       = "${aws_api_gateway_stage.this.invoke_url}/products"
}
