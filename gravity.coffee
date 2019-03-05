pi = Math.PI
sqrt = Math.sqrt
log = Math.log10
pow = Math.pow
AU = 149597870700  # meters
G = 6.67408e-11  # Gravitational constant, m3/kg/s^2

# {pi, sqrt, log, pow} = Math

acceleration = (m, d) -> G*m/(d*d)  # meter/s^2, m is for other body

class Body
  
  dims: ["x", "y"]
  
  constructor: (@spec) ->
    {@canvas, @name, @radius, @color, mass, @massDev, @position, @velocity} = @spec
    @initMass = mass
    @radius ?= 10
    @massDev ?= 3
    @setMass mass
    @addSlider()
    @resetForce()
    @draw()
    #console.log this
    
  addSlider: ->
    
    container = $(".slider-container")
    container.append "<p>#{@name}</p>"
    
    #console.log "dev", @massDev
    
    center = log(@mass)
    dev = @massDev
    
    slider = $ "<input>",
      type: "range"
      min: center - dev
      max: center + dev
      value: center
      step: 0.01
    container.append slider
    
    slider.on "input change", =>
      #console.log slider.val()
      @setMass pow(10, slider.val())
      #console.log mass
      
  setMass: (@mass) ->
    # If radius is 100x bigger, vol is V bigger.  What is V?
    # If vol is 1e6 bigger, radius is x bigger
    #@radius = log(@mass) * 2
    #@radius = 10
    r = 2*((log(@mass / @initMass) / @massDev + 2))  #Math.ceil(pow(@mass, 1/ 3) / 1e9)
    
    @lineWidth = r
    
    #console.log r
    #@radius = r
    
    # V^(1/3)
    
    
  draw: ->
    @canvas.circle @position.x, @position.y, @radius, @color, @lineWidth
    
  move: (t) ->
    for dim in @dims
      @velocity[dim] += @acceleration[dim] * t
      @position[dim] += @velocity[dim] * t
    @draw()
  
  distanceTo: (body) ->
    distance = {}
    sumSq = 0
    for dim in @dims
      d = body.position[dim] - this.position[dim]
      distance[dim] = d
      sumSq += d**2
    distance.d = sqrt(sumSq)
    distance
    
  accelerationFrom: (body) ->
    mass = body.mass
    distance = @distanceTo body
    #console.log "dx, dy, distance", body.name, distance.x/AU, distance.y/AU, distance.d/AU
    d = distance.d
    a = acceleration(mass, d)
    accel = {a}
    for dim in @dims
      accel[dim] = a * distance[dim]/d
    #console.log "accel from #{body.name}", accel.a, accel.x, accel.y
    accel
    
  resetForce: ->
    @acceleration = {x: 0, y: 0}
    
  accumulateForce: (body) ->
    a = @accelerationFrom body
    for dim in @dims
      @acceleration[dim] += a[dim]
    
  forces: (bodies) ->
    
    #console.log "===This body===", this.name
    
    @resetForce()
    for body in bodies
      continue if body.name is @name
      @accumulateForce body
    
    #console.log "acceleration", @acceleration
      

class System
  
  scale: 100/AU   # Pixels per astronomical unit
  timeStep: 24 * 3600
  snapshotDelay: 0 # 500
  numSteps: 10000   # Infinity
  
  constructor: (canvasSel) ->
    @canvas = new Canvas {selector: canvasSel, @scale}
    @bodies = []
  
  add: (spec) ->
    spec.canvas = @canvas
    body = new Body spec
    @bodies.push body
    body
  
  start: ->
    @step = 0
    @next()
  
  next: ->
    @step++
    return if @step>@numSteps
    setTimeout (=> @frame()), @snapshotDelay
  
  frame: ->
    window.requestAnimationFrame =>
      @canvas.clear()
      @snapshot()
      @next()
    
  snapshot: ->
    
    for body in @bodies
      body.forces(@bodies)
    
    for body in @bodies
      body.move(@timeStep)


class Canvas
  
  constructor: (@spec) ->
    {@selector, @scale} =  @spec
    @canvas = $(@selector)[0]
    @ctx = @canvas.getContext "2d"
    @width = @canvas.width
    @height = @canvas.height
  
  clear: ->
    @ctx.clearRect 0, 0, @width, @height
    
  translate: (x, y) ->
    x = @width/2 + @scale*x
    y = @height/2 - @scale*y
    @ctx.translate x, y
    
  circle: (x, y, r, color="black", lineWidth=1) ->
    
    @ctx.save()
    
    @translate x, y
    
    @ctx.beginPath()
    
    startAngle = 0
    endAngle = 2*pi
    counterClockwise = false
    
    @ctx.strokeStyle = color
    @ctx.lineWidth = lineWidth
    # ctx.fillStyle = "white"
    
    @ctx.arc 0, 0, r, startAngle, endAngle, counterClockwise
    @ctx.stroke()
    #ctx.fill()
    
    @ctx.restore()


class App
  
  constructor: ->
    
    @system = new System "#gravity-canvas"
    
    @system.add
      name: "Sun"
      radius: 30
      color: "green"
      mass: 1.989e30 # kg
      massDev: 1
      position: {x: 0, y: 0}  # m
      velocity: {x: 0, y: 0}  # m/s
      
    @system.add
      name: "Venus"
      radius: 7
      color: "#90a346"
      mass: 4.867e24
      position: {x: 0.723*AU, y: 0}
      velocity: {x: 0, y: -35000}
    
    earth = @system.add
      name: "Earth"
      radius: 5
      color: "blue"  # red
      mass: 5.972e24 * 900
      massDev: 3
#      mass: 5.972e24
      position: {x: -1*AU, y: 0}
#      velocity: {x: 0, y: 0}
      velocity: {x: 0, y: 29780}
      
    @system.add
      name: "Moon"
      radius: 1
      color: "#555"
      mass: 7.342e22 * 1000
      massDev: 3
#      mass: 7.342e22
      position: {x: earth.position.x+0.06*AU, y: 0}
#      position: {x: earth.position.x+0.00257*AU, y: 0}
      velocity: {x: 0, y: earth.velocity.y + 7000}
#      velocity: {x: 0, y: earth.velocity.y + 1022}
    
    @system.add
      name: "Mars"
      radius: 8
      color: "red"
      mass: 6.39e23
      position: {x: -1.524*AU, y: 0*AU}
      velocity: {x: 0, y: 24000}
    #
    # @system.add
    #   name: "Asteroid"
    #   radius: 1
    #   mass: 1000
    #   position: {x: -0.5*AU, y: 0*AU}
    #   velocity: {x: 0, y: 50000}
  
    @system.start()


new App
