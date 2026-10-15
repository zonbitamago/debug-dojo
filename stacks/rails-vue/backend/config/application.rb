require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"

Bundler.require(*Rails.groups)

module Shop
  class Application < Rails::Application
    config.load_defaults 7.2
    config.api_only = true

    config.time_zone = "Tokyo"
    config.active_record.default_timezone = :utc

    $stdout.sync = true
    config.logger = ActiveSupport::TaggedLogging.new(ActiveSupport::Logger.new($stdout))
    # LOG_SQL=1 のとき、実行したSQLをログに出す
    config.log_level = ENV["LOG_SQL"] == "1" ? :debug : :info

    config.hosts.clear
  end
end
