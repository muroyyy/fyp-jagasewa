variable "project_name" {
  description = "Project name"
  type        = string
}

variable "domain_name" {
  description = "Domain name (e.g., jagasewa.com)"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for DNS validation"
  type        = string
}