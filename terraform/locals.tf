locals {
  stage   = var.environment
  project = var.project

  backend_urls = {
    dev     = "https://backend-chapa-tu-venta-development.up.railway.app"
    staging = "https://backend-chapa-tu-venta-staging.up.railway.app"
    prod    = "https://backend-chapa-tu-venta-production.up.railway.app"
  }

  tags = {
    Project    = var.project_name
    Stage      = local.stage
    Repository = var.repository
    ManagedBy  = "terraform"
  }
}
