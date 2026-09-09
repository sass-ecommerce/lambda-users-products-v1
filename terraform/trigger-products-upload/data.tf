data "aws_s3_bucket" "products" {
  bucket = "${var.project}-bucket-products-${var.stage}-01"
}

data "aws_caller_identity" "current" {}
