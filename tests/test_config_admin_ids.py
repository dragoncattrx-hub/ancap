from app.config import Settings


def test_settings_parses_platform_admin_user_ids_from_csv():
    settings = Settings(platform_admin_user_ids="  user-1, user-2 ,, user-3  ")
    assert settings.platform_admin_user_ids_allowlist == ("user-1", "user-2", "user-3")


def test_settings_keeps_raw_platform_admin_user_ids_string_for_env_loading():
    settings = Settings(platform_admin_user_ids=" user-1 , , user-2 ")
    assert settings.platform_admin_user_ids == " user-1 , , user-2 "
    assert settings.platform_admin_user_ids_allowlist == ("user-1", "user-2")


def test_settings_parses_empty_platform_admin_user_ids_as_empty_tuple():
    settings = Settings(platform_admin_user_ids="   ,  , ")
    assert settings.platform_admin_user_ids_allowlist == ()
