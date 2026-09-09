import {
  to = aws_cognito_user_pool.this
  id = tolist(data.aws_cognito_user_pools.this.ids)[0]
}

resource "aws_cognito_user_pool" "this" {
  name = "${local.project}-user-pool-${local.stage}"

  lambda_config {
    pre_sign_up         = module.trigger_pre_signup.lambda_arn
    post_confirmation   = module.trigger_post_confirmation.lambda_arn
    post_authentication = module.trigger_post_authentication.lambda_arn

    pre_token_generation_config {
      lambda_arn     = module.trigger_pre_token.lambda_arn
      lambda_version = "V2_0"
    }
  }

  lifecycle {
    ignore_changes = [
      alias_attributes,
      username_attributes,
      auto_verified_attributes,
      password_policy,
      mfa_configuration,
      software_token_mfa_configuration,
      sms_configuration,
      sms_authentication_message,
      sms_verification_message,
      email_configuration,
      email_verification_message,
      email_verification_subject,
      admin_create_user_config,
      verification_message_template,
      account_recovery_setting,
      schema,
      user_pool_add_ons,
      username_configuration,
      device_configuration,
      tags,
      tags_all,
    ]
  }
}
