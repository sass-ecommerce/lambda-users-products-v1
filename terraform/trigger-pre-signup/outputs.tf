output "lambda_name" {
  description = "Nombre de la Lambda Function"
  value       = local.function_name
}

output "lambda_arn" {
  description = "ARN de la Lambda Function"
  value       = module.lambda.function_arn
}
