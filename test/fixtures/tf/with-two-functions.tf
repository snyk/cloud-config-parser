resource "aws_kms_key" "efs" {
  description             = format("KMS key for EFS %s-%s-%s", var.environment, var.project, random_string.efs_prefix.result)
  deletion_window_in_days = 7
  is_enabled              = true
  tags = merge(
    var.tags,
    {
      "Name" = format(
        "%s-%s-%s-key",
        var.environment,
        var.project,
        random_string.efs_prefix.result
      ),
      "type" = "kms",
    },
  )
}
