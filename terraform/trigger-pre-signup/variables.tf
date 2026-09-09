variable "project" {
  type = string
}

variable "cognito_user_pool_arn" {
  type = string
}

variable "role_arn" {
  type = string
}

variable "stage" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
