variable "project" {
  type = string
}

variable "aws_region" {
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
