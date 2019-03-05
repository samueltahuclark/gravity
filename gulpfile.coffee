elixir = require 'laravel-elixir'

# Need resources/assets/coffee/gravity.coffee
gravity = (mix) ->
  mix
    .coffee [
      '/gravity.coffee'
    ], 'gravity.js', {header: true}
    .browserSync proxy: 'sam.dev'
    
elixir (mix) ->
  gravity mix

