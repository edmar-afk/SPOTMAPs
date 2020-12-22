(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require, exports, module);
  } else {
    root.CountUp = factory();
  }
}(this, function(require, exports, module) {

var CountUp = function(target, startVal, endVal, decimals, duration, options) {

	// make sure requestAnimationFrame and cancelAnimationFrame are defined
	// polyfill for browsers without native support
	// by Opera engineer Erik Möller
	var lastTime = 0;
	var vendors = ['webkit', 'moz', 'ms', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame =
		  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}
	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}

	var self = this;
    self.version = function () { return '1.8.3'; };

	function formatNumber(num) {
		num = num.toFixed(self.decimals);
		num += '';
		var x, x1, x2, rgx;
		x = num.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? self.options.decimal + x[1] : '';
		rgx = /(\d+)(\d{3})/;
		if (self.options.useGrouping) {
			while (rgx.test(x1)) {
				x1 = x1.replace(rgx, '$1' + self.options.separator + '$2');
			}
		}
		return self.options.prefix + x1 + x2 + self.options.suffix;
	}
	// Robert Penner's easeOutExpo
	function easeOutExpo(t, b, c, d) {
		return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
	}
	function ensureNumber(n) {
		return (typeof n === 'number' && !isNaN(n));
	}

	// default options
	self.options = {
		useEasing: true, // toggle easing
		useGrouping: true, // 1,000,000 vs 1000000
		separator: ',', // character to use as a separator
		decimal: '.', // character to use as a decimal
		easingFn: easeOutExpo, // optional custom easing function, default is Robert Penner's easeOutExpo
		formattingFn: formatNumber, // optional custom formatting function, default is formatNumber above
		prefix: '', // optional text before the result
		suffix: '' // optional text after the result
	};

	// extend default options with passed options object
	if (options && typeof options === 'object') {
		for (var key in self.options) {
			if (options.hasOwnProperty(key) && options[key]) {
				self.options[key] = options[key];
			}
		}
	}

	if (self.options.separator === '') self.options.useGrouping = false;

	self.initialize = function() {
		if (self.initialized) return true;
		self.d = (typeof target === 'string') ? document.getElementById(target) : target;
		if (!self.d) {
			console.error('[CountUp] target is null or undefined', self.d);
			return false;
		}
		self.startVal = Number(startVal);
		self.endVal = Number(endVal);
		// error checks
		if (ensureNumber(self.startVal) && ensureNumber(self.endVal)) {
			self.decimals = Math.max(0, decimals || 0);
			self.dec = Math.pow(10, self.decimals);
			self.duration = Number(duration) * 1000 || 2000;
			self.countDown = (self.startVal > self.endVal);
			self.frameVal = self.startVal;
			self.initialized = true;
			return true;
		}
		else {
			console.error('[CountUp] startVal or endVal is not a number', self.startVal, self.endVal);
			return false;
		}
	};

	// Print value to target
	self.printValue = function(value) {
		var result = self.options.formattingFn(value);

		if (self.d.tagName === 'INPUT') {
			this.d.value = result;
		}
		else if (self.d.tagName === 'text' || self.d.tagName === 'tspan') {
			this.d.textContent = result;
		}
		else {
			this.d.innerHTML = result;
		}
	};

	self.count = function(timestamp) {

		if (!self.startTime) { self.startTime = timestamp; }

		self.timestamp = timestamp;
		var progress = timestamp - self.startTime;
		self.remaining = self.duration - progress;

		// to ease or not to ease
		if (self.options.useEasing) {
			if (self.countDown) {
				self.frameVal = self.startVal - self.options.easingFn(progress, 0, self.startVal - self.endVal, self.duration);
			} else {
				self.frameVal = self.options.easingFn(progress, self.startVal, self.endVal - self.startVal, self.duration);
			}
		} else {
			if (self.countDown) {
				self.frameVal = self.startVal - ((self.startVal - self.endVal) * (progress / self.duration));
			} else {
				self.frameVal = self.startVal + (self.endVal - self.startVal) * (progress / self.duration);
			}
		}

		// don't go past endVal since progress can exceed duration in the last frame
		if (self.countDown) {
			self.frameVal = (self.frameVal < self.endVal) ? self.endVal : self.frameVal;
		} else {
			self.frameVal = (self.frameVal > self.endVal) ? self.endVal : self.frameVal;
		}

		// decimal
		self.frameVal = Math.round(self.frameVal*self.dec)/self.dec;

		// format and print value
		self.printValue(self.frameVal);

		// whether to continue
		if (progress < self.duration) {
			self.rAF = requestAnimationFrame(self.count);
		} else {
			if (self.callback) self.callback();
		}
	};
	// start your animation
	self.start = function(callback) {
		if (!self.initialize()) return;
		self.callback = callback;
		self.rAF = requestAnimationFrame(self.count);
	};
	// toggles pause/resume animation
	self.pauseResume = function() {
		if (!self.paused) {
			self.paused = true;
			cancelAnimationFrame(self.rAF);
		} else {
			self.paused = false;
			delete self.startTime;
			self.duration = self.remaining;
			self.startVal = self.frameVal;
			requestAnimationFrame(self.count);
		}
	};
	
	self.reset = function() {
		self.paused = false;
		delete self.startTime;
		self.initialized = false;
		if (self.initialize()) {
			cancelAnimationFrame(self.rAF);
			self.printValue(self.startVal);
		}
	};
	
	self.update = function (newEndVal) {
		if (!self.initialize()) return;
		cancelAnimationFrame(self.rAF);
		self.paused = false;
		delete self.startTime;
		self.startVal = self.frameVal;
		self.endVal = Number(newEndVal);
		if (ensureNumber(self.endVal)) {
			self.countDown = (self.startVal > self.endVal);
			self.rAF = requestAnimationFrame(self.count);
		} else {
			console.error('[CountUp] update() - new endVal is not a number', newEndVal);
		}
	};

	
	if (self.initialize()) self.printValue(self.startVal);
};

return CountUp;

}));


// CHART JS
	window.randomScalingFactor = function() {
		//return (Math.random() > 0.5 ? 1.0 : -1.0) * Math.round(Math.random() * 100);
		return Math.floor(Math.random() * (70 - 35 + 1)) + 35;
	}

	// Graph options
	var options = {
	  title: { display: false},
	  legend:{ display:false },
	  maintainAspectRatio : false,
	  responsive: false,
	  tooltips: {enabled: false},
	  animation: {
	      duration : 1800,
	      easing : 'easeOutBack'
	  },
	  scales:{
	      xAxes: [{ display: false }],
	      yAxes: [{
		      display: false,
		      ticks: {
		      		beginAtZero:true,
	            	min: 0,
		            max: 100
		        }
		      }]
	  }
	};

	// The container
	var ctx = document.getElementById("c").getContext("2d"),
		gradient = ctx.createLinearGradient(0, 0, 0, 400);

	// Line data
	var dataset_01 = {
	    label: "datasets 01",
	    backgroundColor: gradient,
	    borderColor: "rgba(0,0,0,0)",
	    pointBorderColor: "rgba(0,0,0,0)",
	    pointRadius: 0,
	    data:[randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor()]
	    //data: [35, 60, 70, 65, 45, 55, 30, 30, 55, 45, 50]
	};

	var dataset_02 = {
	    label: "datasets 02",
	    backgroundColor: gradient,
	    borderColor: "rgba(0,0,0,0)",
	    pointBorderColor: "rgba(0,0,0,0)",
	    pointRadius: 0,
	    data:[randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor()]
	    //data: [55, 70, 60, 70, 55, 50, 60, 55, 70, 70, 55]
	};

	var dataset_03 = {
	    label: "datasets 02",
	    backgroundColor: gradient,
	    borderColor: "rgba(0,0,0,0)",
	    pointBorderColor: "rgba(0,0,0,0)",
	    pointRadius: 0,
	    data:[randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor(),randomScalingFactor()]
	    //data: [55, 70, 60, 70, 55, 50, 60, 55, 70, 70, 55]
	};

	// Graph data
	var data = {
	    labels: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"],
	    datasets: [dataset_01]
	};

	gradient.addColorStop(0, 'rgba(58, 250, 6, 1)');
	gradient.addColorStop(1, 'rgba(0, 180, 250, 0)');


	// Display the first chart
	var myLineChart = new Chart(ctx, {
	    type: 'line',
	    data: data,
	    options : options
	});

	// Add second chart after a delay
	setTimeout(function(){
	    myLineChart.chart.config.data.datasets.unshift(dataset_02);
	    myLineChart.update();
	},300);

	// Add third chart after a delay
	setTimeout(function(){
	    myLineChart.chart.config.data.datasets.unshift(dataset_03);
	    myLineChart.update();
	},600);

// END CHART JS

$(document).ready(function() {

	//header switch
	$('input[type=radio][name=switch]').change(function() {

    	myLineChart.chart.config.data.datasets.forEach(function(dataset) {

            dataset.data = dataset.data.map(function() {
                return randomScalingFactor();
            });

        });
    	myLineChart.update();

    	var easingFn = function (t, b, c, d) {
		  var ts = (t /= d) * t;
		  var tc = ts * t;
		  return b + c * (tc * ts + -5 * ts * ts + 10 * tc + -10 * ts + 5 * t);
		}

    	var countoptions = {
		  useEasing : true,
		  easingFn: easingFn,
		  useGrouping : true,
		  separator : '.',
		  decimal : '.',
		  prefix : '',
		  suffix : ''
		};

		var firstNumber = jQuery("#firstNr").attr("rel");
		var firstNr = new CountUp("firstNr", firstNumber, 0, 1, 2, countoptions);

		var secondNumber = jQuery("#secondNr").attr("rel");
		var secondNr = new CountUp("secondNr", secondNumber, 0, 1, 2, countoptions);

		var thirdNumber = jQuery("#thirdNr").attr("rel");
		var thirdNr = new CountUp("thirdNr", thirdNumber, 0, 0, 2, countoptions);

		var fourthNumber = jQuery("#fourthNr").attr("rel");
		var fourthNr = new CountUp("fourthNr", fourthNumber, 0, 0, 2, countoptions);

    	if (this.value == '2015') {
            newFirstNumber = 3;
            newSecondNumber = 2;
            newThirdNumber = 3;
            newfourthNumber = 71;
        }
        else if (this.value == '2016') {
            newFirstNumber = 4;
            newSecondNumber = 2;
            newThirdNumber = 3;
            newfourthNumber = 85;
        }
        else if (this.value == '2017') {
            newFirstNumber = 3;
            newSecondNumber = 4;
            newThirdNumber = 3;
            newfourthNumber = 86;
        }
        jQuery("#firstNr").attr("rel", newFirstNumber);
        jQuery("#secondNr").attr("rel", newSecondNumber);
        jQuery("#thirdNr").attr("rel", newThirdNumber);
        jQuery("#fourthNr").attr("rel", newfourthNumber);

    	firstNr.update(newFirstNumber);
    	secondNr.update(newSecondNumber);
    	thirdNr.update(newThirdNumber);
    	fourthNr.update(newfourthNumber);

    });

});