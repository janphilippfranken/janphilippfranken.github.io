// Javascript for demo of intervention and time

/////////////
//Non-user-definable things
/////////////

//var N = 5 //How many nodes
//var density = .1 //What proportion of the nodes should be connected on average if drawing connections at random.
////var locMode = 'even'; //'random'; //Or else equal = equally spaced

var locations = [];
var edges = [];
var nodes = [];
var activeNodes = [];
var activations = [];



var nodeRadius = 25; //How many pixels big should the nodes be?
var arrowAngle = 15 * (Math.PI / 180);
var baseColor = 0xB3B3B3;
var blockedColor = 0x000000;
var activeColor = 0xFFD000;
var arrowColor = 0x000000;

var onFor = 1000; //How long should each node light up?
var sec = 0;
var timeOut = 60;

var ongoing = []; //Makes sure there's only one ongoing event per edge

var propEvs = []; //Keep a list of all the propagation event timers
var deactEvs = [];


var data = [];
data.eventTimings = [];
data.eventOrigins = [];
data.eventDelays = [];

//Set up stage on the canvas
//var stage = new Stage("c");



///////////
//Functions
///////////

function Start() {

	//Set up stage on the canvas
	stage = new Stage("c");
	s = new Sprite();
	stage.addChild(s);
	sec = 0; //Reset timer

	c.width = 600;
	c.height = 400;


	//Grab the parameters
	cond = parent.params.cond;
	mode = parent.params.mode;
	bn = parent.params.bn;
	locMode = parent.params.locMode;
	N = parent.params.N;
	density = parent.params.density;
	contingency = parent.params.contingency;
	timeout = parent.params.timeout;
	background = parent.params.background;
	delay_mu = parent.params.delay_mu;
	delay_alpha = parent.params.delay_alpha;
	delay_beta = delay_mu / delay_alpha;
	time_space_cor = parent.params.time_space_cor;

	console.log('delays distribution', delay_alpha, delay_beta, delay_alpha * delay_beta, delay_mu);

	////////////////////////
	//Initialise the canvas
	////////////////////////

	pixel_ratio = window.devicePixelRatio;
	console.log('pixel_ratio', pixel_ratio);


	console.log('c', c, '\n s', s, '\n stage', stage, stage.canvas);
	console.log(c.width, stage.stageWidth, stage.canvas.width);

	var d = new Date();
	startTime = d.getTime();
	console.log('data', data);
	for (var i = 0; i < N; i++)
	{
		data.eventTimings[i] = [];
		data.eventOrigins[i] = [];
		data.eventDelays[i] = [];

	}
	/////////////////////////////
	//Initialise and draw network
	/////////////////////////////

	//Creates network (an adjacency matrix)
	GenerateNetwork(N, density);

	//Creates locations, an array of x and y locations for the nodes
	SelectLocations(N, [0, c.width * pixel_ratio], [0, c.height * pixel_ratio], locMode, nodeRadius);



	//Creates nodes and activeNodes (arrays of node sprites)
	//And listenNodes (boolean tracking the event listeners again)
	DrawNodes(locations, nodeRadius * pixel_ratio, baseColor, activeColor);

	//Creates
	GenerateBaselineActivations(bn, background, N);

	BaselineActivations(activations);

	console.log(cond, bn, N, timeout, background, delay_mu, delay_alpha, time_space_cor);

	CreateInterfaceObjects();

	DrawNetwork(locations, nodeRadius * pixel_ratio, arrowAngle, arrowColor);

	//Creates edges (array of edge sprites)
	//...and listenEdges (boolean tracking if they have event listeners attached)
	if (mode == 'practice') {
		TurnOnEdges(network);
		console.log('drawing network at start');
	} else {
		ActivateRevealButton();
	}

	CreateProcessCounter();
	StartTimer();
	//StartClockTimer();


}


function Stop() {
	console.log('Stop function');

	//Stop any timers
	console.log('propEvs', propEvs, 'deactEvs', deactEvs);
	for (var i = 0; i < 9999; i++) {
		window.clearInterval(i);
		window.clearTimeout(i);
	}

	//Stop the activations
	for (var i = 0; i < activations.length; i++) {
		for (var j = 0; j < activations[i].length; j++) {
			clearTimeout(activationTimeouts[i][j]);
		}

		for (j = 0; j < edges[i].length; j++) {
			// if (listenEdges[i][j] == true) {
			// }

			if (i != j) {
				stage.removeChild(edges[i][j]);
			}

		}

		//Remove all the event listeners
		if (listenNodes[i] == true) {

			blockedNodes[i].removeEventListener(MouseEvent.CLICK, StopBlock, false);
			blockedNodes[i].removeEventListener(MouseEvent.RIGHT_CLICK, StopBlock, false);
			nodes[i].removeEventListener(MouseEvent.RIGHT_CLICK, StartBlock, false);
			nodes[i].removeEventListener(MouseEvent.CLICK, ActivationEvent, false);
			activeNodes[i].removeEventListener(MouseEvent.RIGHT_CLICK, StartBlock, false);
			listenNodes[i] == false;
		}


		//Remove sprites
		stage.removeChild(nodes[i]);
		stage.removeChild(blockedNodes[i]);
		stage.removeChild(activeNodes[i]);
	}
	//Remove the timer
	stage.removeChild(timer);
	stage.removeChild(counter);

	timer.text = 0;
	nodes = blockedNodes = activeNodes = edges = [];

	parent.dataBox.text = data.toString();

	console.log('nodes', nodes, 'edges', edges);
}


function Pause() {

	//Stop any timers
	console.log('propEvs', propEvs, 'deactEvs', deactEvs);
	for (var i = 0; i < 9999; i++) {
		window.clearInterval(i);
		window.clearTimeout(i);
	}

	//Clear out activations
	for (var i = 0; i < activations.length; i++) {
		for (var j = 0; j < activations[i].length; j++) {
			clearTimeout(activationTimeouts[i][j]);
		}

		//Remove all the event listeners
		if (listenNodes[i] == true) {

			blockedNodes[i].removeEventListener(MouseEvent.CLICK, StopBlock, false);
			blockedNodes[i].removeEventListener(MouseEvent.RIGHT_CLICK, StopBlock, false);
			nodes[i].removeEventListener(MouseEvent.RIGHT_CLICK, StartBlock, false);
			nodes[i].removeEventListener(MouseEvent.CLICK, ActivationEvent, false);

			activeNodes[i].removeEventListener(MouseEvent.RIGHT_CLICK, StartBlock, false);

			listenNodes[i] = false;
		}
	}
	activations = [];
}

function Resume() {

	console.log(nodes);

	//Sets up some new baseline activations
	GenerateBaselineActivations(bn, background, N);

	for (var i = 0; i < nodes.length; i++) {

		console.log('reinstate listening', cond, listenNodes);
		//Add back all the event listeners
		if (cond == 'active' & listenNodes[i] == false) {
			blockedNodes[i].addEventListener(MouseEvent.CLICK, StopBlock, false);
			blockedNodes[i].addEventListener(MouseEvent.RIGHT_CLICK, StopBlock, false);
			nodes[i].addEventListener(MouseEvent.RIGHT_CLICK, StartBlock, false);
			nodes[i].addEventListener(MouseEvent.CLICK, ActivationEvent, false);
			activeNodes[i].addEventListener(MouseEvent.RIGHT_CLICK, StartBlock, false);

			listenNodes[i] = true;
		}
	}

	StartTimer();
}



function ActivationEvent(evt) {
	//window.alert(evt.target.id);
	whichBlocked[evt.target.id] = false;
	ActivateNode([evt.target.id, 'a',0]);
}

function StartBlock(evt) {
	console.log('start block', evt.target.id);

	activeNodes[evt.target.id].visible = false;

	BlockNode(evt.target.id);
}

function StopBlock(evt) {
	console.log('stop block', evt.target.id);
	UnblockNode(evt.target.id);
}

function BlockNode(id) {
	blockedNodes[id].visible = true;
	whichBlocked[id] = true;
}

function UnblockNode(id) {
	blockedNodes[id].visible = false;
	whichBlocked[id] = false;
}

function ActivateNode(par) {

	//TODO add an origin variable
	console.log('par',par)
	var id = par[0];
	var origin = par[1];
	var prevDelay = par[2];

	var a = activeNodes[id];

	var d = new Date();
	var curTime = d.getTime();
	console.log(data);
	data.eventTimings[id].push(curTime - startTime);
	data.eventOrigins[id].push(origin);
	data.eventDelays[id].push(prevDelay);

	

	// If its not blocked
	if (whichBlocked[id] == false) {
		//Activate the node?
		a.visible = true;

		//Countdown until deactivation
		deactEv = setTimeout(DeactivateNode, onFor, [a.id]);
		deactEvs.push(deactEv);


		//Loop over potential propagations
		for (var i = 0; i < network.length; i++) {

			//If there is a connection
			if (network[a.id][i] == 1) {
				console.log('a.id', a.id, 'i', i, network, contingency)
					//...and if the connection works
				if (Math.random() < contingency) {
					if (ongoing[a.id][i] != 1) {
						//Generate a delay
						//Generates an Erlang distributed number with shape alpha and rate beta]
						//Gammas were too hard to generate!
						var lProd = Math.log(Math.random());
						for (j = 1; j < delay_alpha; j++) {
							lProd = lProd + Math.log(Math.random());
						}

						delay = -delay_beta * lProd;

						console.log('propagation from ', a.id, 'to', i, lProd, delay);

						var propEv = setTimeout(ActivateNode, delay, [i, id, Math.round(delay)]);

						ongoing[a.id][i] = 1;

						var ongoingflat = ongoing.reduce(function(a, b) {
							return a.concat(b);
						}, []);
						var total = ongoingflat.reduce(function(a, b) {
							return a + b;
						});
						counter.text = total;

						setTimeout(turnOffProcess, delay, a.id, i)

						propEvs.push(propEv); //Keep hold of all active propagation timeouts
					}


				}
			}

		}
	} else {
		console.log('activation at ', id, 'blocked');
	}

}

function DeactivateNode(params) {

	var a = activeNodes[params[0]];
	console.log('deactivating', a.id);

	a.visible = false;
}

function BaselineActivations(activations) {
	activationTimeouts = [];
	for (var i = 0; i < activations.length; i++) {
		activationTimeouts[i] = [];
		for (var j = 0; j < activations[i].length; j++) {

			//console.log(i, j, 'a', a, a.x, a.y, activations[i][j], a.visible);

			activationTimeouts[i][j] = setTimeout(ActivateNode, activations[i][j], [i, 'b', 0]);
			// setTimeout(function() {
			// 	ActivateNode(activeNodes, i, 1000);
			// }, activations[i][j])
			console.log(i, j, activationTimeouts[i][j])
		}

	}
}

function GenerateBaselineActivations(bn, rate, N) {

	activations = [];
	for (var i = 0; i < N; i++) {
		activations[i] = []
	}

	if (bn == 'roots') {
		for (var i = 0; i < N; i++) {
			aRoot = true;
			for (var j = 0; j < N; j++) {
				if (network[j][i] == 1) {
					aRoot = false;
				}
			}

			if (aRoot == true) {
				activations[i].push(0);
			}
		}
	} else if (bn == 'all') {
		for (var i = 0; i < N; i++) {
			activations[i].push(0);
		}
		console.log('set up all initial activations', activations)
	}

	for (var i = 0; i < N; i++) {

		//console.log('hihi', -Math.log(1 - Math.random()) / (rate / 1000));
		proposal = -Math.log(1 - Math.random()) / (rate / 1000);

		while (proposal < (timeout * 1000)) {
			activations[i].push(proposal);
			proposal = proposal - Math.log(1 - Math.random()) / (rate / 1000);
		}
	}


	console.log('baseline activations', activations);

	//return activations;
}


//Draws N nodes randomly on the canvas
//Stores their locations/ids somehow
function DrawNodes(locations, nodeRadius, baseColor, activeColor, blockedColor) {

	nodes = [];
	ativeNodes = [];
	blockedNodes = [];
	listenNodes = [];
	whichBlocked = [];

	for (var i = 0; i < locations.length; i++) {


		n = new Sprite();
		n.graphics.beginFill(baseColor, 1);
		n.graphics.drawCircle(0, 0, nodeRadius); //(Math.random()*c.width, Math.random()*c.height
		n.graphics.endFill();
		stage.addChild(n);

		b = new Sprite();
		b.graphics.beginFill(blockedColor, 1);
		b.graphics.drawCircle(0, 0, nodeRadius); //(Math.random()*c.width, Math.random()*c.height
		b.graphics.endFill();


		stage.addChild(b);

		a = new Sprite();
		a.graphics.beginFill(activeColor, 1);
		a.graphics.drawCircle(0, 0, nodeRadius); //(Math.random()*c.width, Math.random()*c.height
		a.graphics.endFill();
		a.id = i;
		stage.addChild(a);

		//console.log(b)
		n.x = b.x = a.x = locations[i][0];
		n.y = b.y = a.y = locations[i][1];
		n.id = b.id = a.id = i;
		a.visible = b.visible = false;

		//console.log(b)

		if (cond == 'active') {
			n.addEventListener(MouseEvent.CLICK, ActivationEvent, false);
			n.addEventListener(MouseEvent.RIGHT_CLICK, StartBlock, false);
			a.addEventListener(MouseEvent.RIGHT_CLICK, StartBlock, false);
			b.addEventListener(MouseEvent.CLICK, StopBlock, false);
			b.addEventListener(MouseEvent.RIGHT_CLICK, StopBlock, false);

			listenNodes.push(true);
		} else {
			listenNodes.push(false);
		}

		whichBlocked.push(false);

		nodes.push(n);
		blockedNodes.push(b);
		activeNodes.push(a);
	}


	//return [nodes, activeNodes];
}


function DrawNetwork(locations, d, t, color) {
	edges = [];
	listenEdges = []; //Not convinced this does anything...

	for (var i = 0; i < locations.length; i++) {
		edges[i] = [];
		listenEdges[i] = [];

		for (var j = 0; j < locations.length; j++) {

			listenEdges[i][j] = false;

			if (i != j) {

				e = new Sprite();

				theta = Math.atan((locations[j][1] - locations[i][1]) / (locations[j][0] - locations[i][0]));
				//console.log(theta)

				var w = (locations[j][0] - locations[i][0])
				var h = (locations[j][1] - locations[i][1])

				var x0 = d * Math.abs(Math.cos(theta)) * Math.sign(w);
				var y0 = d * Math.abs(Math.sin(theta)) * Math.sign(h);

				var x1 = w - d * Math.abs(Math.cos(theta)) * Math.sign(w);
				var y1 = h - d * Math.abs(Math.sin(theta)) * Math.sign(h);

				// var x1 = locations[j][0] - locations[i][0];
				// var y1 = locations[j][1] - locations[i][1];
				var l = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
				var arh = [
					[],
					[]
				];


				arh[0][0] = x1 - [(x1 - x0) * Math.cos(t) - (y1 - y0) * Math.sin(t)] * (d / l)
				arh[0][1] = y1 - [(y1 - y0) * Math.cos(t) + (x1 - x0) * Math.sin(t)] * (d / l)

				arh[1][0] = x1 - [(x1 - x0) * Math.cos(t) + (y1 - y0) * Math.sin(t)] * (d / l)
				arh[1][1] = y1 - [(y1 - y0) * Math.cos(t) - (x1 - x0) * Math.sin(t)] * (d / l)

				//console.log('i', i, 'j', j, 'signs', Math.sign(w), Math.sign(h), 'cos', Math.cos(theta), 'sin', Math.sin(theta), 'coords', x0, y0, x1, y1, 'l', l, [x1, y1, arh[0][0], arh[0][1], arh[1][0], arh[1][1]]);


				e.graphics.lineStyle(3, color);

				e.graphics.moveTo(x0, y0);

				e.graphics.lineTo(x1, y1);

				//  "buffered" triangle
				e.graphics.beginFill(color);
				e.graphics.drawTriangles([x1, y1, arh[0][0], arh[0][1], arh[1][0], arh[1][1]], [0, 1, 2]);
				e.graphics.endFill();



				//Draw a triangle half a node-width from the head end
				//Create all the shapes as sprites but only make some visible (i.e. move this to draw nodes)
				edges[i][j] = e;
				listenEdges[i][j] = false;

				stage.addChild(e);

				e.x = locations[i][0]
				e.y = locations[i][1]
				e.visible = false;

			}

		}
	}
	//console.log('edges', edges);
	//return edges;
}


function GenerateNetwork(N, density) {
	network = [];
	ongoing = [];
	for (var i = 0; i < N; i++) {
		network[i] = [];
		ongoing[i] = [];
		for (var j = 0; j < N; j++) {

			ongoing[i][j] = 0; //Tracks ongoing causation
			if (Math.random() < density & i != j) {
				//console.log(i, j)
				network[i][j] = 1;

			} else {
				network[i][j] = 0;
			}

		}
	}
	console.log('network', network);

	//return network;
}


//Select locations for the nodes
function SelectLocations(N, xrange, yrange, locMode, nodeRadius) {

	locations = [];

	if (locMode == 'random') {

		var count = 0;

		while (count < N) {
			var proposal = [Math.round(Math.random() * (xrange[1] - xrange[0]) + xrange[0]),
				Math.round(Math.random() * (yrange[1] - yrange[0]) + yrange[0])
			]

			var pass = 1;
			for (var i = 0; i < (locations.length); i++) {

				//Non overlapping
				if (!(Math.abs(proposal[0] - locations[i][0]) > (nodeRadius * 3) &
						Math.abs(proposal[1] - locations[i][1]) > (nodeRadius * 3))) {
					pass = 0;
				}

			}

			//console.log('pass', pass, 'locations.length', locations.length);

			if (pass == 1) {
				locations.push(proposal);
				count = count + 1;
			} else {
				console.log('too close', locations, proposal);
			}
		}
	} else if (locMode == 'even') {
		var C = [(xrange[1] - xrange[0]) / 2 + xrange[0], (yrange[1] - yrange[0]) / 2 + yrange[0]];

		var r = Math.min(C[0], C[1]) - nodeRadius;
		var increment = (360 / N) * Math.PI / 180;
		for (var x = 0; x < N; x++) {

			var proposal = [r * Math.cos(increment * x) + C[0], r * Math.sin(increment * x) + C[1]];
			locations.push(proposal)
				//(r×cos(36∘x+18∘),r×sin(36∘x+18∘))
				//with x={0,1,2,3,4,5,6,7,8,9}
		}
	}
	console.log('locations', xrange, yrange, locations);

	//return locations;
}



function CreateInterfaceObjects() {
	//Interface counter
	var f1 = new TextFormat("Arial Black", 15 * pixel_ratio, 0x000000, true, false, "right");
	counter = new TextField();

	counter.selectable = false; // default is true
	counter.setTextFormat(f1);
	counter.text = "0";
	counter.width = counter.textWidth;
	counter.height = counter.textHeight;
	stage.addChild(counter);
	counter.x = pixel_ratio * 50;
	counter.y = pixel_ratio * (c.height - 60);
	console.log('process counter', pixel_ratio, counter.x, counter.y)

	//Clock that is updated with a set interval
	timer = new TextField();

	timer.selectable = false; // default is true
	timer.setTextFormat(f1);
	timer.text = "0";
	timer.width = timer.textWidth * 3;
	timer.height = timer.textHeight;
	stage.addChild(timer);
	timer.x = pixel_ratio * (c.width - 200);
	timer.y = pixel_ratio * (c.height - 60);

	//Clock that reads the system time
	clockTimer = new TextField();
	clockTimer.selectable = false; // default is true
	clockTimer.setTextFormat(f1);
	clockTimer.text = "";
	clockTimer.width = clockTimer.textWidth * 3;
	clockTimer.height = clockTimer.textHeight;
	stage.addChild(clockTimer);
	clockTimer.x = pixel_ratio * (c.width - 200);
	clockTimer.y = pixel_ratio * (c.height - 110);

	//A button for revealing the network 
	revealBtn = new TextField(); //document.createElement("input");
	//Assign different attributes to the element. 
	revealBtn.selectable = false;
	revealBtn.setTextFormat(f1);
	revealBtn.text = "Reveal Network";
	revealBtn.width = revealBtn.textWidth;
	revealBtn.height = revealBtn.textHeight * 1.5;
	console.log('revealBtn', revealBtn);
	stage.addChild(revealBtn);
	revealBtn.background = true;
	revealBtn.border = true;

	revealBtn.x = pixel_ratio * (c.width - revealBtn.textWidth / 2);
	revealBtn.y = revealBtn.textHeight * 2;
	revealBtn.visible = false;
}

function CreateProcessCounter() {


}

function turnOffProcess(from, to) {
	ongoing[from][to] = 0;

	var ongoingflat = ongoing.reduce(function(a, b) {
		return a.concat(b);
	}, []);

	var total = ongoingflat.reduce(function(a, b) {
		return a + b;
	});

	counter.text = total;
	console.log('ended process');
}

function StartTimer() {

	timerObjFunc = setInterval(function() {
		sec = sec + .1;
		timer.text = sec.toFixed(1); //pad(++sec % 60);
		timer.width = timer.textWidth;
		if (sec > timeOut) {
			parent.Stop();
		}

	}, 100);

}

function StartClockTimer() {

	clockTimerObjFunc = setInterval(function() {
		var d = new Date();
		var sec = (d.getSeconds() - startTime); //.toFixed(1)
		var ms = Math.round((d.getMilliseconds() - startTime) / 100);
		clockTimer.text = sec.toString() + '.' + ms.toString();
		//console.log('clocktimer ', d.getSeconds(), d.getSeconds() - startTime, startTime)
	}, 100);
}

function pad(val) {
	return val > 9 ? val : "0" + val;
}

function ActivateRevealButton() {
	revealBtn.visible = true;
	revealBtn.addEventListener(MouseEvent.CLICK, RevealNetwork, false);
}

function RevealNetwork() {
	revealBtn.visible = false;
	TurnOnEdges(network);
	console.log('revealing network')
}

function TurnOnEdges(network) {
	console.log('turn on edges', network, edges)
	for (var i = 0; i < network.length; i++) {
		for (var j = 0; j < network[i].length; j++) {
			if (i != j) {
				if (network[i][j] == 1) {
					//console.log('drawing', i, j)
					edges[i][j].visible = true;
				} else {
					edges[i][j].visible = false;
				}
			}
		}
	}
}