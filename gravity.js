// Generated by CoffeeScript 1.11.1
(function() {
  var AU, App, Body, Canvas, G, System, acceleration, log, pi, pow, sqrt;

  pi = Math.PI;

  sqrt = Math.sqrt;

  log = Math.log10;

  pow = Math.pow;

  AU = 149597870700;

  G = 6.67408e-11;

  acceleration = function(m, d) {
    return G * m / (d * d);
  };

  Body = (function() {
    Body.prototype.dims = ["x", "y"];

    function Body(spec1) {
      var mass, ref;
      this.spec = spec1;
      ref = this.spec, this.canvas = ref.canvas, this.name = ref.name, this.radius = ref.radius, this.color = ref.color, mass = ref.mass, this.massDev = ref.massDev, this.position = ref.position, this.velocity = ref.velocity;
      this.initMass = mass;
      if (this.radius == null) {
        this.radius = 10;
      }
      if (this.massDev == null) {
        this.massDev = 3;
      }
      this.setMass(mass);
      this.addSlider();
      this.resetForce();
      this.draw();
    }

    Body.prototype.addSlider = function() {
      var center, container, dev, slider;
      container = $(".slider-container");
      container.append("<p>" + this.name + "</p>");
      center = log(this.mass);
      dev = this.massDev;
      slider = $("<input>", {
        type: "range",
        min: center - dev,
        max: center + dev,
        value: center,
        step: 0.01
      });
      container.append(slider);
      return slider.on("input change", (function(_this) {
        return function() {
          return _this.setMass(pow(10, slider.val()));
        };
      })(this));
    };

    Body.prototype.setMass = function(mass1) {
      var r;
      this.mass = mass1;
      r = 2 * (log(this.mass / this.initMass) / this.massDev + 2);
      return this.lineWidth = r;
    };

    Body.prototype.draw = function() {
      return this.canvas.circle(this.position.x, this.position.y, this.radius, this.color, this.lineWidth);
    };

    Body.prototype.move = function(t) {
      var dim, i, len, ref;
      ref = this.dims;
      for (i = 0, len = ref.length; i < len; i++) {
        dim = ref[i];
        this.velocity[dim] += this.acceleration[dim] * t;
        this.position[dim] += this.velocity[dim] * t;
      }
      return this.draw();
    };

    Body.prototype.distanceTo = function(body) {
      var d, dim, distance, i, len, ref, sumSq;
      distance = {};
      sumSq = 0;
      ref = this.dims;
      for (i = 0, len = ref.length; i < len; i++) {
        dim = ref[i];
        d = body.position[dim] - this.position[dim];
        distance[dim] = d;
        sumSq += Math.pow(d, 2);
      }
      distance.d = sqrt(sumSq);
      return distance;
    };

    Body.prototype.accelerationFrom = function(body) {
      var a, accel, d, dim, distance, i, len, mass, ref;
      mass = body.mass;
      distance = this.distanceTo(body);
      d = distance.d;
      a = acceleration(mass, d);
      accel = {
        a: a
      };
      ref = this.dims;
      for (i = 0, len = ref.length; i < len; i++) {
        dim = ref[i];
        accel[dim] = a * distance[dim] / d;
      }
      return accel;
    };

    Body.prototype.resetForce = function() {
      return this.acceleration = {
        x: 0,
        y: 0
      };
    };

    Body.prototype.accumulateForce = function(body) {
      var a, dim, i, len, ref, results;
      a = this.accelerationFrom(body);
      ref = this.dims;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        dim = ref[i];
        results.push(this.acceleration[dim] += a[dim]);
      }
      return results;
    };

    Body.prototype.forces = function(bodies) {
      var body, i, len, results;
      this.resetForce();
      results = [];
      for (i = 0, len = bodies.length; i < len; i++) {
        body = bodies[i];
        if (body.name === this.name) {
          continue;
        }
        results.push(this.accumulateForce(body));
      }
      return results;
    };

    return Body;

  })();

  System = (function() {
    System.prototype.scale = 100 / AU;

    System.prototype.timeStep = 24 * 3600;

    System.prototype.snapshotDelay = 0;

    System.prototype.numSteps = 10000;

    function System(canvasSel) {
      this.canvas = new Canvas({
        selector: canvasSel,
        scale: this.scale
      });
      this.bodies = [];
    }

    System.prototype.add = function(spec) {
      var body;
      spec.canvas = this.canvas;
      body = new Body(spec);
      this.bodies.push(body);
      return body;
    };

    System.prototype.start = function() {
      this.step = 0;
      return this.next();
    };

    System.prototype.next = function() {
      this.step++;
      if (this.step > this.numSteps) {
        return;
      }
      return setTimeout(((function(_this) {
        return function() {
          return _this.frame();
        };
      })(this)), this.snapshotDelay);
    };

    System.prototype.frame = function() {
      return window.requestAnimationFrame((function(_this) {
        return function() {
          _this.canvas.clear();
          _this.snapshot();
          return _this.next();
        };
      })(this));
    };

    System.prototype.snapshot = function() {
      var body, i, j, len, len1, ref, ref1, results;
      ref = this.bodies;
      for (i = 0, len = ref.length; i < len; i++) {
        body = ref[i];
        body.forces(this.bodies);
      }
      ref1 = this.bodies;
      results = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        body = ref1[j];
        results.push(body.move(this.timeStep));
      }
      return results;
    };

    return System;

  })();

  Canvas = (function() {
    function Canvas(spec1) {
      var ref;
      this.spec = spec1;
      ref = this.spec, this.selector = ref.selector, this.scale = ref.scale;
      this.canvas = $(this.selector)[0];
      this.ctx = this.canvas.getContext("2d");
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    }

    Canvas.prototype.clear = function() {
      return this.ctx.clearRect(0, 0, this.width, this.height);
    };

    Canvas.prototype.translate = function(x, y) {
      x = this.width / 2 + this.scale * x;
      y = this.height / 2 - this.scale * y;
      return this.ctx.translate(x, y);
    };

    Canvas.prototype.circle = function(x, y, r, color, lineWidth) {
      var counterClockwise, endAngle, startAngle;
      if (color == null) {
        color = "black";
      }
      if (lineWidth == null) {
        lineWidth = 1;
      }
      this.ctx.save();
      this.translate(x, y);
      this.ctx.beginPath();
      startAngle = 0;
      endAngle = 2 * pi;
      counterClockwise = false;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.arc(0, 0, r, startAngle, endAngle, counterClockwise);
      this.ctx.stroke();
      return this.ctx.restore();
    };

    return Canvas;

  })();

  App = (function() {
    function App() {
      var earth;
      this.system = new System("#gravity-canvas");
      this.system.add({
        name: "Sun",
        radius: 30,
        color: "#f4bc42",
        mass: 1.989e30,
        massDev: 1,
        position: {
          x: 0,
          y: 0
        },
        velocity: {
          x: 0,
          y: 0
        }
      });
      this.system.add({
        name: "Venus",
        radius: 7,
        color: "#90a346",
        mass: 4.867e24,
        position: {
          x: 0.723 * AU,
          y: 0
        },
        velocity: {
          x: 0,
          y: -35000
        }
      });
      earth = this.system.add({
        name: "Earth",
        radius: 5,
        color: "blue",
        mass: 5.972e24 * 900,
        massDev: 3,
        position: {
          x: -1 * AU,
          y: 0
        },
        velocity: {
          x: 0,
          y: 29780
        }
      });
      this.system.add({
        name: "Moon",
        radius: 1,
        color: "#555",
        mass: 7.342e22 * 1000,
        massDev: 3,
        position: {
          x: earth.position.x + 0.06 * AU,
          y: 0
        },
        velocity: {
          x: 0,
          y: earth.velocity.y + 7000
        }
      });
      this.system.add({
        name: "Mars",
        radius: 8,
        color: "red",
        mass: 6.39e23,
        position: {
          x: -1.524 * AU,
          y: 0 * AU
        },
        velocity: {
          x: 0,
          y: 24000
        }
      });
      this.system.start();
    }

    return App;

  })();

  new App;

}).call(this);

//# sourceMappingURL=gravity.js.map
