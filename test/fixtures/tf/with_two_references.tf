resource "azurerm_virtual_machine" "denied_3" {
  name                = "production"
  resource_group_name = "networking"

  os_profile_linux_config {
    disable_password_authentication = false
  }

  os_profile {
    custom_data = <<CUSTOM
CUSTOM
  }
}

resource "azurerm_linux_virtual_machine" "denied_2" {
  custom_data = <<CUSTOM
eouireoiureioureiorueioraskdljsalkdjaskldjsakldjsalkdjsadasrerksmsd
daklsdjklasjflskjraweoirewoirejwharoinasef
CUSTOM
}
