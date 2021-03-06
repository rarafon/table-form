var world = {
	map: [],
	playerLoc: [1,1],
	setPLoc(y, x) {
		if (coordValid(y, x)) {
			this.playerLoc = [y, x];
		}
	},

	classTranslator(value) { // give it a letter (ex: "r") to get back the right color/ class ("red"). Also, can work in reverse
		if (value.length <= 1) {
			switch(value) { // NOTE: ALSO UPDATE ELSE CASE AND VALUETRANSLATOR
				case "r": return "red";
				case "g": return "green";
				default: console.log("classTranslator: " + value);
						 throw("Unknown value given to classTranslator");
			}
		} else {
			switch(value) {
				case "red": return "r";
				case "green": return "g";
				default: console.log("classTranslator: " + value);
						 throw("Unknown value given to classTranslator");
			}
		}
	},
	changeMap(y, x, colorValue) { // Changes the value in map array and appends the corresponding class in the table-cell
		if ( coordValid(y, x) ) {
			if (this.map[y][x] === " ") {
				this.map[y][x] = colorValue;

				var ele = document.getElementById(y + "_" + x);
				ele.className = this.classTranslator(colorValue);

				return true;
			}
		} else {
			return false;
		}

	},

	calculate(y, x) { // will calculate the points of that current position
							 // color is for theoretical calculation if something were placed there
		var sum = 0;

		funcCallFourDir(y, x, function(y1, x1) {
			sum += world.valueTranslator(y1, x1);
		})

		sum += world.valueTranslator(y, x);

		return sum;
	},

	valueTranslator(y, x) {
		switch(world.map[y][x]) {
			case "r": return -1;
			case "g": return 1;
			case " ": return 0;
			default: throw("Error in valueTranslator " + this.map[y][x]);
		}	
	}


};


var controller = {
	master(status, y, x) {
		if (status === "clicked") {
			this.clicked(y,x);
			red.response(y, x); // runs controller.calculator from red block placement
			this.calculator(y,x);
		}
	},

	clicked(y, x) {
		var ele = document.getElementById(y + "_" + x);

		world.changeMap(y, x, "g") // appends "g" onto the map where player clicked
		world.setPLoc(y, x);

	},

	calculator(y, x) { // handles what to do with destroying blocks, etc depending on their values.
		
		funcCallFourDir(y, x, function(y1, x1) {
			if (world.valueTranslator(y1, x1) > 0) {
				var value = world.calculate(y1, x1);

				setMapValue(y1, x1, value);
				
			} else if (world.valueTranslator(y1, x1) < 0) {
				var value = world.calculate(y1, x1);

				setMapValue(y1, x1, -value);
			}
		}, true ); // true so that controller also acts on y, x
	}
	
};

var red = {
	greenBlocks(y, x) {
		var sum = 0;

		funcCallFourDir(y, x, function(y1, x1) {
			if (world.valueTranslator(y1, x1) > 0) {
				sum += world.valueTranslator(y1, x1);
			}
		})

		sum += world.valueTranslator(y, x);

		return sum;
	},

	bestResponse(y, x) { // checks for where block to place to be next to greatest value of green blocks
		var sums = {};
		var max = -100;

		funcCallFourDir(y, x, function(y1, x1, i) {

			if (world.map[y1][x1] === ' ') {

				sums[i] = red.greenBlocks(y1, x1);

				max = Math.max(max, sums[i]);

			}

		}, false);

		var maxI = [];

		for (var key in sums) {
			if (sums[key] === max) {
				maxI.push(key);
			}
		}

		if (maxI.length >= 1) {
			var randomIndex = Math.floor(maxI.length * Math.random());
			return Number(maxI[randomIndex]);
		} else { // returns false if none of 4 directions have an empty space
			return false;
		}
	},

	response(y, x) { // uses bestResponse to check for block placement. if it returns false, then place random block on map
		var dir = this.bestResponse(y, x);

		if (dir !== false) {

			var coord = calculateFromI(y, x, dir);

			world.changeMap(coord[0], coord[1], "r");

			controller.calculator(coord[0], coord[1])

			return true;

		} else {

			var count = 0, max = world.map.length * world.map[0].length;
			while ( count < max) {
				y = Math.floor(Math.random() * world.map.length);
				x = Math.floor(Math.random() * world.map[y].length);

				var bool = world.changeMap(y, x, "r");

				if ( bool ) {
					controller.calculator(y, x);
					return true;
				}
			}
		}

		return false;
	},


	greenList: [],

	notSurrounded(y, x) { // returns true if block in y,x has an empty block surrounding it
		var status = false;

		funcCallFourDir(y, x, function(y1, x1) {
			if (world.map[y1][x1] === " ") {
				status = true;
			}
		})

		return status;

	},

	testIfSurrounded(y, x) { // runs notSurrounded in the 4 spaces surrounded y,x and adds to list if true, but also removes it from list if it becomes notSurrounded
		funcCallFourDir(y, x, function(y1, x1) {
			if (world.valueTranslator(y1, x1) >= 1) {
				var index = red.greenList.indexOf(y1 + "_" +x1);

				if ( index === -1 ) {
					if ( red.notSurrounded(y1, x1) ) {
						red.greenList.push(y1 + "_" +x1);
					}
				} else {
					if ( !red.notSurrounded(y1, x1) ) {
						red.greenList.splice(index, 1);
					}
				}
			}

		}, true)
	}
};

var green = {

};

function init() {
	var cols = Math.floor((window.innerWidth / 10) * 0.80);
	var rows = Math.floor(window.innerHeight / 10 - 2);

	makeTable(rows, cols);
	makeDisplay();

	document.onkeydown = function(e) {
		if (e.keyCode >= 37 && e.keyCode <= 40) {
			var i = keyToDir(e);

			var pLoc = world.playerLoc;
			var coord = calculateFromI( pLoc[0], pLoc[1], i);
			pLoc = [coord[0], coord[1]];

			controller.master( "clicked", pLoc[0], pLoc[1]);
		}
	}

	var table = document.getElementById("table");

	function clicky(event) {
		var target = event.target;

		var str = /(\d*)_(\d*)/.exec(target.id);
		var y = Number(str[1]); 
		var x = Number(str[2]);

		controller.master("clicked", y, x);
	}

	table.addEventListener("click", clicky, false)
};

window.onload = init;