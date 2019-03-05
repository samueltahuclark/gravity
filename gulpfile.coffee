elixir = require 'laravel-elixir'

gravity = (mix) ->
  mix
    .coffee [
      '/gravity.coffee'
    ], 'gravity.js', {header: true}
    .browserSync proxy: 'sam.dev'
    
elixir (mix) ->
  gravity mix

