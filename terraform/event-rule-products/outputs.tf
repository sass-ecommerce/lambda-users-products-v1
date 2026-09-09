output "lambda_name" {
  description = "Nombre de la Lambda Function"
  value       = local.function_name
}

output "event_rule_arn" {
  description = "ARN del EventBridge Rule"
  value       = data.aws_ssm_parameter.rule_products_arn.value
  sensitive   = true
}
