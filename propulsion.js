/*
Copyright (c) 2010 Caleb Helbling

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

Object.accessors = function(obj,name,get,set) {
	if (Object.defineProperty !== undefined) { // ECMAScript 5
		Object.defineProperty(obj,name,{
			get: get,
			set: set
		});
	} else if (Object.prototype.__defineGetter__ !== undefined) { // Nonstandard
		obj.__defineGetter__(name,get);
		obj.__defineSetter__(name,set);
	}
};

if (!Object.prototype.watch) {
    Object.prototype.watch = function (prop, handler) {
        var oldvalue = this[prop], newvalue = oldvalue,
			getter = function () {
				return newvalue;
			},
			setter = function (value) {
				oldvalue = newvalue;
				newvalue = handler.call(this, prop, oldvalue, value);
				return newvalue;
			};
			
        if (delete this[prop]) { // can't watch constants
            if (Object.defineProperty) { // ECMAScript 5
                Object.defineProperty(this, prop, {
                    get: getter,
                    set: setter
                });
            } else if (Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__) { // legacy
                Object.prototype.__defineGetter__.call(this, prop, getter);
                Object.prototype.__defineSetter__.call(this, prop, setter);
            }
        }
    };
}

if (!Object.prototype.unwatch) {
    Object.prototype.unwatch = function (prop) {
        var value = this[prop];
        delete this[prop]; // remove accessors
        this[prop] = value;
    };
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(needle) {
		var len = this.length;
		for (var i = 0; i < len; i++) {
			if (this[i] === needle) {
				return i;
			}
		}
		
		return -1;
	};
}

if (!Object.create) {
	Object.create = (function() {
		var F = function() {};
		
		return function (obj) {
			F.prototype = obj;
			return new F();
		};
	})();
}

Object.accessors(Object.prototype,'proto',function() {
	if (Object.getPrototypeOf !== undefined) {
		return Object.getPrototypeOf(this);
	} else {
		return this.__proto__;
	}
},function(value) {	
	this.__proto__ = value;
	return value;
});

// Resource objects for the developer
var spr = {},
	rm = {},
	obj = {},
	snd = {},
	al = {},
	global = {};

var walkDown = (function() {
	var isRegistered = function(obj) {
		if (obj.hasOwnProperty('registered') && obj.registered === true) {
			return true;
		}
		
		return false;
	};
	
	return function(obj,last) {
		var arr = false,
			func = false;
		
		if (typeof last === 'function') {
			func = last;
		} else {
			if (last === true) {
				// A true value means that the function should return a new array
				arr = [];
			} else {
				// An array was (probably) passed as the last parameter. Continue adding the objects to the existing array
				arr = last;
			}
		}
					
		if (isRegistered(obj)) {
			if (arr === false) {
				func.call(obj,obj);
			} else {
				arr[arr.length] = obj;
			}
		}
		
		if (obj.hasOwnProperty('children')) {
			var len = obj.children.length;
			for (var i = 0; i < len; i++) {
				walkDown(obj.children[i],(arr || func));
			}
		}
		
		return (arr || true);
	};
})();

var init = function(id,width,height) {
	if (navigator.userAgent.indexOf('Opera') !== -1) {
		init.isOpera = true;
	} else {
		init.isOpera = false;
	}

	var canvas = document.getElementById(id);
	draw.display.element = canvas;
	
	if (width === undefined || height === undefined) {
		draw.display.width = canvas.getAttribute('width');
		draw.display.height = canvas.getAttribute('height');
	} else {
		draw.display.width = width;
		draw.display.height = height;
	}
	
	draw.display.ctx = canvas.getContext('2d');
	
	draw.buffer.element = document.createElement('canvas');
	draw.buffer.ctx = draw.buffer.element.getContext('2d');
	
	view.width = draw.display.width;
	view.height = draw.display.height;
	
	window.onkeydown = function(event) {
		var keyobj = key.number[event.keyCode || event.which];
		
		if (keyobj !== undefined) {
			if (keyobj.pressed === false) {
				keyobj.down = true;
				keyobj.pressed = true;
			}
		}
		
		return false;
	};
	
	window.onkeyup = function(event) {
		var keyobj = key.number[event.keyCode || event.which];
		
		if (keyobj !== undefined) {
			keyobj.pressed = false;
			keyobj.up = true;
		}
		
		return false;
	};
	
	var loffset = function(elem) {
		var o = elem.offsetLeft;

		if (elem.offsetParent !== null) {
			o += loffset(elem.offsetParent);
		}
		
		return o;
	};

	var toffset = function(elem) {
		var o = elem.offsetTop;

		if (elem.offsetParent !== null) {
			o += toffset(elem.offsetParent);
		}
		
		return o;
	};

	var offsetLeft = loffset(canvas);
	var offsetTop = toffset(canvas);
	
	window.onmousemove = function(e) {
		var posx = 0;
		var posy = 0;
		if (!e) {
			e = window.event;
		}
		
		if (e.pageX || e.pageY) {
			posx = e.pageX;
			posy = e.pageY;
		} else if (e.clientX || e.clientY) {
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		
		posx = posx-offsetLeft;
		posy = posy-offsetTop;
		
		mouse.x = (posx/draw.display.width)*view.width+view.x;
		mouse.y = (posy/draw.display.height)*view.height+view.y;
	};
	
	window.onmousedown = function(e) {
		var button;
		
		switch(e.button) {
			case 0:
				button = mouse.left;
			break;
			
			case 1:
				button = mouse.middle;
			break;
			
			case 2:
				button = mouse.right;
			break;
		}
		
		button.down = true;
		button.pressed = true;
	};
	
	window.onmouseup = function(e) {
		var button;
		
		switch(e.button) {
			case 0:
				button = mouse.left;
			break;
			
			case 1:
				button = mouse.middle;
			break;
			
			case 2:
				button = mouse.right;
			break;
		}
		
		button.up = true;
		button.pressed = false;
	};
	
	// Event handler for mouse wheel event.
	var wheel = function(event){
		var delta = 0;
		
		if (event.wheelDelta) { // Opera and Chrome
			delta = event.wheelDelta;
		} else if (event.detail) { // Firefox
			delta = -event.detail;
		}

		// Positive delta: wheel up
		// Negative delta: wheel down
		if (delta < 0) {
			mouse.wheel.down = true;
		} else {
			mouse.wheel.up = true;
		}
		
		// Prevent default scroll actions
		if (event.preventDefault) {
			event.preventDefault();
		}
		event.returnvalue = false;
	};

	// Mouse wheel initialization code
	if (window.addEventListener) {
		// DOMMouseScroll is for Firefox
		window.addEventListener('DOMMouseScroll', wheel, false);
	}
	// Opera and Chrome
	window.onmousewheel = document.onmousewheel = wheel;
};

var load = (function() {	
	var loadAudio = function() {
		var imgArray = load.spritesList,
			audio = load.soundList;
		
		// Controls what happens when the audio finishes loading
		var finished = function() {
			load.soundList.shift();
			load.completed += 1;
			
			// Start loading the next audio file
			loadAudio();
		};
		
		if (load.soundList.length > 0) {
			var thisAud = load.soundList[0];
			thisAud.src = thisAud.url;
			
			// Firefox won't begin loading the audio until something is done with the audio object.
			thisAud.pause();
			
			var canplaythroughListener = function() {
				// Make sure it doesn't fire again...
				thisAud.removeEventListener('canplaythrough',canplaythroughListener,true);
				
				finished();
			};
			
			// Detection to check if the audio finished loading or if an error happened
			thisAud.addEventListener('canplaythrough',canplaythroughListener,true);
			
			var errorListener = function() {
				// Make sure it doesn't fire again...
				thisAud.removeEventListern('error',errorListener,true);
				
				finished();
			};
			
			thisAud.addEventListener('error',errorListener,true);
			
		} else {
			// Everything is finished loading :D Invoke the callback
			load.callback();
		}
	};
	
	var loadImage = function() {
		var imgArray = load.spritesList,
			audio = load.soundList;
			
		if (imgArray.length > 0) {
			var img = imgArray[0].imgObj;
			img.src = imgArray[0].url;
			
			img.onload = function() {
				var img = imgArray[0];
				img.width = img.imgObj.width;
				img.height = img.imgObj.height;
				
				// Width of each subimage for sprite strips
				img.subWidth = img.width/img.subimg;
				
				// Set up the default mask
				img.mask = [[-img.xorig,-img.yorig],[img.subWidth-img.xorig,-img.yorig],[img.subWidth-img.xorig,img.height-img.yorig],[-img.xorig,img.height-img.yorig]];
				
				img.pattern = draw.buffer.ctx.createPattern(img.imgObj,'repeat');
				imgArray.shift();
				
				load.completed += 1;
				
				// Start loading the next image
				loadImage();
			};
		} else {
			// Start loading audio when all the sprites are done loading
			loadAudio();
		}
	};
	
	return function(callback) {
		load.callback = callback;
		load.total = load.spritesList.length + load.soundList.length;
		load.completed = 0;
		
		loadImage();
	};
})();

load.soundList = [];
load.spritesList = [];

var Alarm = function(callback) {
	// Make sure it's called as a constructor
	if (!(this instanceof Alarm)) {
		return new Alarm(callback);
	}
	
	this.time = null;
	this.callback = callback;
	
	Alarm.list[Alarm.list.length] = this;
	
	return this;
};

Alarm.list = [];

Alarm.prototype.stop = function() {
	this.time = null;
	return this;
};

var Sound = function(url) {
	var audObj = new Audio('');
	
	// The actual audio object won't get a src until load is called
	audObj.url = url;
	
	// Queue it to be loaded
	load.soundList[load.soundList.length] = audObj;
	
	return audObj;
};

var SoundEffect = (function() {
	// "Recycle" the audio object for another playing
	var ended = function() {
		this.currentTime = 0;
		this.pause();
	};
	
	return function(url,amount) {
		// amount is the number of audio objects that should be made for this sound effect
		var that = [];
				
		for (var i = 0; i < amount; i++) {
			var audObj = new Audio('');
			audObj.url = url;
			audObj.effect = that;
			that[i] = audObj;
			load.soundList[load.soundList.length] = audObj;
			console.log(load.soundList.length);
			
			audObj.addEventListener('ended',ended,true);
		}
		
		that.position = 0;
		that.play = function() {
			// Move the next available audio object to the end of the list
			var aud = this[this.position];
			this[this.length] = aud;
			
			// Remove the audio object from the top of the list
			delete this[this.position];
			
			// Update the position so the next audio object will be ready for the next play
			this.position += 1;
			
			aud.play();
			
			return true;
		};
		
		// Stop all the sound effects from playing
		that.stop = function() {
			var pos = this.position,
				len = this.length;
				
			for (var i = pos; i < len; i++) {
				ended.call(this[i]);
			}
			
			return true;
		};
		
		return that;
	};
}());

var collision = {
	masks: function(mask1,x1,y1,angle1,mask2,x2,y2,angle2) {
		return collision.sat(collision.resolveShape(mask1,x1,y1,angle1),collision.resolveShape(mask2,x2,y2,angle2));
	},
	
	point: function(mask,mx,my,angle,px,py) {
		return collision.sat(collision.resolveShape(mask,mx,my,angle),[[px,py]]);
	},
	
	rectangle: function(mask,mx,my,angle,x1,y1,width,height) {
		var x2 = x1+width,
			y2 = y1+height;
			
		return collision.sat(collision.resolveShape(mask,mx,my,angle),[[x1,y1],[x2,y1],[x2,y2],[x1,y2]]);
	},
	
	line: function(mask,mx,my,angle,x1,y1,x2,y2) {
		return collision.sat(collision.resolveShape(mask,mx,my,angle),[[x1,y1],[x2,y2]]);
	},
	
	// The SAT algorithm is capable of collision detection between points,
	// line segments, and any concave polygon
	sat: (function() {
		var vector = {
			normalize: function(vector) {
				var x = vector[0],
					y = vector[1],
					len = Math.sqrt(x*x+y*y);
				
				vector[0] = x/len;
				vector[1] = y/len;
				
				return vector;
			},
			
			dot: function(a,b) {
				return a[0]*b[0]+a[1]*b[1];
			},
			
			leftNormal: function(v) {
				return [-v[1],v[0]];
			}
		};
		
		var getAxes = function(s,array) {
			// s = shape
			var p1,p2,edge;
			
			if (s.length !== 1) {
				for (var i = 0; i < s.length; i++) {
					if (s.length === 2 && i === 1) {
						break;
					}
					
					// Get the current vertex
					p1 = s[i];
					
					// Get the next vertex
					p2 = s[i+1 === s.length ? 0 : i+1];
					
					// Subtract the two to get the edge vector
					edge = [p1[0]-p2[0],p1[1]-p2[1]];
					
					// The axis will be the normal of the edge
					array.push(vector.normalize(vector.leftNormal(edge)));
				}
			}
			
			return array;
		};
		
		var project = function(shape,axis) {
			var min = null,
				max = null;
				
			for (var i = 0; i < shape.length; i++) {
				var p = vector.dot(axis,shape[i]);
				
				if (p < min || min === null) {
					min = p;
				}
				
				if (p > max || max === null) {
					max = p;
				}
			}
			
			return  {
				min: min,
				max: max
			};
		};
		
		return function(shape1,shape2) {
			// Determine the axes
			var axes = getAxes(shape1,[]);
			getAxes(shape2,axes);
			
			// Project each shape onto each axis			
			var proj1,proj2;
			for (var i = 0; i < axes.length; i++) {
				proj1 = project(shape1,axes[i]);
				proj2 = project(shape2,axes[i]);
				
				// Check for overlaps between the projections
				if (!((proj1.min > proj2.min && proj1.min < proj2.max) || (proj1.max > proj2.min && proj1.max < proj2.max) || (proj2.min > proj1.min && proj2.min < proj1.max) || (proj2.max > proj1.min && proj2.max < proj1.max))) {
					return false;
				}
			}
			
			return true;
		};
	})(),
	
	// Takes the unrotated relatively position mask and rotates it
	// and absolutely aligns it
	resolveShape: (function() {
		var resolvePoint = function(point,x,y,angle) {
			var s = Math.sin(angle),
				c = Math.cos(angle);
			
			return [x+Math.floor(point[0]*c-point[1]*s),y+Math.floor(point[0]*s+point[1]*c)];
		};
	
		return function(mask,x,y,angle) {
			var newShape = [];
			for (var i = 0; i <mask.length; i++) {
				newShape.push(resolvePoint(mask[i],x,y,angle));
			}
			
			return newShape;
		};
	})()
};

var move = {
	direction: function(obj,angle,length) {
		obj.x += Math.round(Math.cos(angle)*length);
		obj.y += Math.round(Math.sin(angle)*length);
		
		return obj;
	}
};

Math.choose = function() {
	return arguments[Math.floor(Math.random()*arguments.length)];
};

Math.pointDirection = function(x1,y1,x2,y2) {
	var angle = Math.atan2(y2-y1,x2-x1);
	
	if (angle < 0) {
		angle += 6.283185307179586;
	}
	
	return angle;
};

Math.pointDistance = function(x1,y1,x2,y2) {
	var s1 = x1-x2,
		s2 = y1-y2;
	return Math.sqrt(s1*s1+s2*s2);
};

Math.degToRad = function(deg) {
	return deg*0.017453292519943295;
};

Math.radToDeg = function(rad) {
	return rad*57.29577951308232;
};

var draw = {
	// Holds data on the buffer and display canvases
	display: {},
	buffer: {},
	
	get alpha() {
		return draw.buffer.ctx.globalAlpha;
	},
	
	set alpha(value) {
		draw.buffer.ctx.globalAlpha = value;
		return value;
	},
	
	get color() {
		return draw.buffer.ctx.fillStyle;
	},
	
	set color(value) {
		var ctx = draw.buffer.ctx;
		
		ctx.fillStyle = value;
		ctx.strokeStyle = value;
		
		return value;
	},
	
	get cursor() {
		return draw.display.element.style.cursor;
	},
	
	set cursor(value) {
		draw.display.element.style.cursor = value;
		return value;
	},
	
	get font() {
		return draw.buffer.ctx.font;
	},
	
	set font(value) {
		draw.buffer.ctx.font = value;
		return value;
	},
	
	get lineWidth() {
		return draw.buffer.ctx.lineWidth;
	},
	
	set lineWidth(value) {
		draw.buffer.ctx.lineWidth = value;
		return value;
	},
	
	get textHalign() {
		return draw.buffer.ctx.textAlign;
	},
	
	set textHalign(value) {
		draw.buffer.ctx.textAlign = value;
		return value;
	},
	
	get textValign() {
		return draw.buffer.ctx.textBaseline;
	},
	
	set textValign(value) {
		draw.buffer.ctx.textBaseline = value;
		return value;
	},
	
	clear: function() {
		draw.buffer.ctx.clearRect(0,0,view.width,view.height);
		draw.display.ctx.clearRect(0,0,view.width,view.height);
	},
	
	circle: function(x,y,radius,stroke,color) {
		if (color !== undefined) {
			draw.color = color;
		}
		
		x -= view.x;
		y -= view.y;
		
		draw.buffer.ctx.beginPath();
		draw.buffer.ctx.arc(x,y,radius,0,6.283185307179586,false);
		
		if (stroke) {
			draw.buffer.ctx.stroke();
		} else {
			draw.buffer.ctx.fill();
		}
	},
	
	depth: function(obj,depth) {
		obj.depth = depth;
		
		loop.regObjects.sort(function(a,b) {
			var ad = a.depth || 0,
				bd = b.depth || 0;
			
			return ad-bd;
		});
	},
	
	line: function(x1,y1,x2,y2,width,color) {
		if (width !== undefined) {
			draw.lineWidth = width;
		}
		
		if (color !== undefined) {
			draw.color = color;
		}
		
		x1 -= view.x+0.5;
		y1 -= view.y+0.5;
		x2 -= view.x+0.5;
		y2 -= view.y+0.5;
		
		draw.buffer.ctx.beginPath();
		draw.buffer.ctx.moveTo(x1,y1);
		draw.buffer.ctx.lineTo(x2,y2);
		draw.buffer.ctx.stroke();
	},
	
	rectangle: function(x1,y1,width,height,stroke,color) {
		if (color !== undefined) {
			draw.color = color;
		}
		
		if (width !== 0 && height !== 0) {
			x1 -= view.x;
			y1 -= view.y;
					
			if (stroke) {
				draw.buffer.ctx.strokeRect(x1,y1,width,height);
			} else {
				draw.buffer.ctx.fillRect(x1,y1,width,height);
			}
		}
	},
	
	text: function(x,y,text,stroke,maxWidth) {
		x -= view.x;
		y -= view.y;
		
		if (stroke) {
			if (maxWidth !== undefined) {
				draw.buffer.ctx.strokeText(text,x,y,maxWidth);
			} else {
				draw.buffer.ctx.strokeText(text,x,y);
			}
		} else {
			if (maxWidth !== undefined) {
				draw.buffer.ctx.fillText(text,x,y,maxWidth);
			} else {
				draw.buffer.ctx.fillText(text,x,y);
			}
		}
	},
	
	triangle: function(x1,y1,x2,y2,x3,y3,stroke,color) {
		if (color !== undefined) {
			draw.color = color;
		}
		
		var ctx = draw.buffer.ctx;
		
		x1 -= view.x;
		y1 -= view.y;
		x2 -= view.x;
		y2 -= view.y;
		x3 -= view.x;
		y3 -= view.y;
		
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.lineTo(x3,y3);
		
		if (stroke) {
			ctx.closePath();  
			ctx.stroke();
		} else {
			ctx.fill();
		}
	}
};

var key = {
	a: {code: 65},
	b: {code: 66},
	c: {code: 67},
	d: {code: 68},
	e: {code: 69},
	f: {code: 70},
	g: {code: 71},
	h: {code: 72},
	i: {code: 73},
	j: {code: 74},
	k: {code: 75},
	l: {code: 76},
	m: {code: 77},
	n: {code: 78},
	o: {code: 79},
	p: {code: 80},
	q: {code: 81},
	r: {code: 82},
	s: {code: 83},
	t: {code: 84},
	u: {code: 85},
	v: {code: 86},
	w: {code: 87},
	x: {code: 88},
	y: {code: 89},
	z: {code: 90},
	
	space: {code: 32},
	enter: {code: 13},
	tab: {code: 9},
	escape: {code: 27},
	backspace: {code: 8},
	shift: {code: 16},
	control: {code: 17},
	alt: {code: 18},
	capsLock: {code: 20},
	numLock: {code: 144},
	
	'0': {code: 48},
	'1': {code: 49},
	'2': {code: 50},
	'3': {code: 51},
	'4': {code: 52},
	'5': {code: 53},
	'6': {code: 54},
	'7': {code: 55},
	'8': {code: 56},
	'9': {code: 57},
	
	left: {code: 37},
	up: {code: 38},
	right: {code: 39},
	down: {code: 40},
	
	insert: {code: 45},
	del: {code: 46},
	home: {code: 36},
	end: {code: 35},
	pageUp: {code: 33},
	pageDown: {code: 34},
	
	f1: {code: 112},
	f2: {code: 113},
	f3: {code: 114},
	f4: {code: 115},
	f5: {code: 116},
	f6: {code: 117},
	f7: {code: 118},
	f8: {code: 119},
	f9: {code: 120},
	f10: {code: 121},
	f11: {code: 122},
	f12: {code: 123},
	
	// A cache is created so that all the keys can be easily be looped through when key states are reset every loop
	
	// Cache each key in an array
	cache: [],
	
	// Cache by a key's code
	number: []
};

// Generate the key cache
(function() {
	var prop;
	for (prop in key) {
		if (key.hasOwnProperty(prop) && prop !== 'cache' && prop !== 'number') {
			key.cache.push(key[prop]);
			key.number[key[prop].code] = key[prop];
			
			// Set key to default properties
			key[prop].down = false;
			key[prop].up = false;
			key[prop].pressed = false;
		}
	}
})();

var mouse = {
	x: null,
	y: null,
	
	left: {
		down: false,
		pressed: false,
		up: false
	},
	
	middle: {
		down: false,
		pressed: false,
		up: false
	},
	
	right: {
		down: false,
		pressed: false,
		up: false
	},
	
	wheel: {
		up: false,
		down: false
	}
};

var Sprite = function(url,subimg,xorig,yorig) {
	if (!(this instanceof Sprite)) {
		return new Sprite(url,subimg,xorig,yorig);
	}
	
	this.imgObj = new Image();
	this.url = url;
	this.subimg = subimg;
	this.xorig = xorig;
	this.yorig = yorig;
	
	load.spritesList.push(this);
	
	return this;
};

Sprite.prototype.draw = function(x,y,subimg,angle,drawWidth,drawHeight) {
	if (subimg === undefined) {
		subimg = 0;
	}
	
	var imgObj = this.imgObj,
		height = this.height,
	
		subWidth = this.subWidth,
		xx = x-view.x,
		yy = y-view.y;
	
	draw.buffer.ctx.save();
	
	if (angle !== undefined && angle !== 0) {
		draw.buffer.ctx.translate(xx,yy);
		draw.buffer.ctx.rotate(angle);
		draw.buffer.ctx.translate(-xx,-yy);
	}
	
	if (drawWidth === undefined) {
		drawWidth = subWidth;
	}
	
	if (drawHeight === undefined) {
		drawHeight = height;
	}
	
	xx -= this.xorig;
	yy -= this.yorig;
	
	draw.buffer.ctx.drawImage(imgObj,subWidth*subimg,0,subWidth,height,xx,yy,drawWidth,drawHeight);
	
	draw.buffer.ctx.restore();

	return this;
};

Sprite.prototype.nextFrame = function(subimg) {
	subimg += 1;
	
	if (subimg === this.subimg) {
		return 0;
	} else {
		return subimg;
	}
};

var view = {	
	x: 0,
	y: 0
};

// view.width
view.watch('width',function(prop,oldvalue,value) {
	draw.buffer.element.setAttribute('width',value);
	return value;
});

// view.height
view.watch('height',function(prop,oldvalue,value) {
	draw.buffer.element.setAttribute('height',value);
	return value;
});

var loop = {
	register: function(obj,x,y) {
		// Registered objects shouldn't be registered again....
		if (!obj.registered || !obj.hasOwnProperty('registered')) {
			var proto = obj.proto;
			
			if (x !== undefined) {
				obj.x = x;
			}
			
			if (y !== undefined) {
				obj.y = y;
			}
			
			if (!proto.hasOwnProperty('children')) {
				proto.children = [];
			}
			
			// Caches the postion of the object in the objects' prototype's children array so it can
			// be quickly removed from it by the remove function
			obj.childrenIndex = proto.children.length;
			proto.children.push(obj);
			
			// Caches the position of the object in the object registration list
			obj.objectsIndex = loop.regObjects.length;
			
			// Register the object to the objects array so it will be included in the loop
			loop.regObjects[obj.objectsIndex] = obj;
			
			obj.registered = true;
			
			// Attempt to invoke the initialize method
			if (typeof obj.initialize === 'function') {
				obj.initialize(obj);
			}
		}
		
		return obj;
	},
	
	remove: function(obj,preventOnRemove) {
		obj.registered = false;
		
		delete obj.proto.children[obj.childrenIndex];
		delete loop.regObjects[obj.objectsIndex];
		
		if (!preventOnRemove && typeof obj.onRemove === 'function') {
			obj.onRemove(obj);
		}
		
		return obj;
	},
	
	beget: function(obj,x,y) {
		return loop.register(Object.create(obj),x,y);
	},
	
	// A list of all registered objects
	regObjects: [],
	
	// This function controls the entirety of the tick, including firing objects's methods, and finishing the double buffer interaction.
	tick: function() {
		var objs = loop.regObjects,obj,i;
	
		draw.clear();

		for (i = 0; i < objs.length; i++) {
			obj = objs[i];
			
			if (obj) {
				if (obj.beginTick) {
					obj.beginTick(obj);
				}
			}
		}
		
		for (i = 0; i<Alarm.list.length; i++) {
			var thisAlarm = Alarm.list[i];
			
			if (thisAlarm.time !== null) {
				thisAlarm.time -= 1;
				
				if (thisAlarm.time <= 0) {
					thisAlarm.time = null;
					thisAlarm.callback();
				}
			}
		}
		
		for (i = 0; i<objs.length; i++) {
			obj = objs[i];
			if (obj) {
				if (obj.tick) {
					obj.tick(obj);
				}
			}
		}
			
		for (i = 0; i<objs.length; i++) {
			obj = objs[i];
			if (obj) {
				if (obj.draw) {
					obj.draw(obj);
				}
			}
		}
		
		for (i = 0; i<objs.length; i++) {
			obj = objs[i];
			if (obj) {
				if (obj.endTick) {
					obj.endTick(obj);
				}
			}
		}
		
		// Draw the buffer to the main canvas
		if (init.isOpera) {
			// Opera doesn't support the width and height arguments for drawImage
			//draw.display.ctx.drawImage(draw.buffer.element,0,0,draw.display.width,draw.display.height);
			draw.display.ctx.drawImage(draw.buffer.element,0,0);
			//draw.display.ctx.drawImage(draw.buffer.element,0,0,draw.display.width,draw.display.height,0,0,draw.display.width,draw.display.height);
		} else {
			draw.display.ctx.drawImage(draw.buffer.element,0,0,draw.display.width,draw.display.height);
		}
		
		// Reset the mouse variables for the next loop
		mouse.left.down = false;
		mouse.left.up = false;
		mouse.middle.down = false;
		mouse.middle.up = false;
		mouse.right.down = false;
		mouse.right.up = false;
		mouse.wheel.up = false;
		mouse.wheel.down = false;
		
		// Reset the key variables for the next loop
		var len = key.cache.length;
		for (i = 0; i < len; i++) {
			var thisKey = key.cache[i];
			thisKey.down = false;
			thisKey.up = false;
		}
	}
};

// loop.active - determines if the loop is currently running
loop.watch('active',function(prop,oldvalue,value) {
	if (value !== oldvalue) {
		clearInterval(loop.timer);
		if (value === true) {
			loop.timer = setInterval(loop.tick,1000/loop.rate);
		}
	}
	
	return value;
});

// loop.rate - sets loop speed
loop.watch('rate',function(prop,oldvalue,value) {
	if (oldvalue !== value) {
		clearInterval(loop.timer);
		
		if (value >= 0 && loop.active === true) {
			loop.timer = setInterval(loop.tick,1000/value);
		}
	}
	
	return value;
});

// room
window.watch('room',function(prop,oldvalue,value) {
	
	var i,obj;
	
	// Stop the loop timer from triggering
	loop.active = false;
	
	// Clear the alarms
	Alarm.list.length = 0;
	
	// Invoke the onRoomChange methods
	for (i = 0; i < loop.regObjects.length; i++) {
		obj = loop.regObjects[i];
		
		if (obj) {
			if (typeof obj.onRoomChange === 'function') {
				obj.onRoomChange(obj);
			}
		}
	}
	
	// Remove all objects except for persistant ones
	for (i = 0; i < loop.regObjects.length; i++) {
		obj = loop.regObjects[i];
		
		if (obj) {
			if (!obj.persistant) {
				loop.remove(obj,true);
				i -= 1;
			}
		}
	}
	
	// Trigger the room
	value();
	
	// Begin the loop timer again
	loop.active = true;
	
	return value;
});

loop.active = false;
loop.rate = 30;