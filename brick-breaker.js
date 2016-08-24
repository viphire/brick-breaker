Array.prototype.eradicate = function(e){	//remove all occurences of e from array
	var i;
	while (true){
		i = this.indexOf(e);
		if (i >= 0)
			this.splice(i, 1);
		else
			break;
	}
}

//brick constructor
var Brick = function(grid_x, grid_y, type, hp, colour){
	this.width = 80;
	this.height = 24;

	this.left = grid_x*this.width;
	this.mid_x = this.left+this.width/2;
	this.right = this.left+this.width;

	this.top = grid_y*this.height;
	this.mid_y = this.top+this.height/2;
	this.bottom = this.top+this.height;

	this.type = type;
	this.hp_orig = this.type === 2 ? 1 : hp;
	this.hp = this.hp_orig;

	this.colliding = false;
	this.visible = true;

	if (this.type === 1)
		this.colour = colour;
	else if (this.type === 2)
		this.colour = 5;
}

Game.prototype.init = function(){
	var x, y;
	this.colours = [
		["#ff0000", "#ff8000", "#00ff00", "#0080ff", "#0000ff", "#808080"],
		["#800000", "#804000", "#008000", "#004080", "#000080", "#404040"]];
	
	//the objects
	this.paddle = {
		x: (this.width - 128)/2,
		y: (this.height - 16),
		width: 128,
		height: 8,
		get left(){return this.x},
		set left(x){this.x = x},
		get top(){return this.y},
		set top(y){this.y = y},
		get right(){return this.x+this.width},
		set right(x){this.x = x-this.width},
		get bottom(){return this.y+this.height},
		set bottom(y){this.y = y-this.height},
		acc: 640,
		spd: 0,
		maxSpd: 500,
		events: [],
		fill: "#0080ff",
		stroke: "#004080",
		strokeWidth: 2
	};

	this.ball = {
		x: 400,
		y: 568,
		radius: 8,
		get left(){return this.x-this.radius},
		get top(){return this.y-this.radius},
		get right(){return this.x+this.radius},
		get bottom(){return this.y+this.radius},
		a: Math.PI/3,
		spd: 300,
		fill: "#ffffff",
		stroke: "#808080",
		strokeWidth: 1
	};

	this.bricks = new Array(10);
	this.num_bricks = 0;
	for (x = 0; x < 10; x++){
		this.bricks[x] = new Array(10);
		for (y = 0; y < 10; y++){
			if (x == 2 || x == 7){
				this.bricks[x][y] = new Brick(x, y, 2);
			}else{
				this.bricks[x][y] = new Brick(x, y, 1, 1+(y >= 4)+(y >= 8), Math.floor(y/2));
				this.num_bricks++;
			}
		}
	}

	this.scene = 0;	//0 = start, 1 = playing, 2 = paused, 3 = died, 4 = won, 5 = lost
	this.lives = 3;
	
	//events
	document.addEventListener("keydown", this.handle_keyhit.bind(this), false);
	document.addEventListener("keyup", this.handle_keyup.bind(this), false);
	this.canvas.addEventListener("focus", function(){if (this.scene === 2) this.scene = 1}.bind(this), true);
	this.canvas.addEventListener("blur", function(){if (this.scene === 1) this.scene = 2}.bind(this), true);
}

Game.prototype.reset = function(){
	this.paddle.x = (this.width - this.paddle.width)/2;
	this.paddle.y = (this.height - this.paddle.height - 8);
	this.paddle.spd = 0;
	this.paddle.events = [];

	this.ball.x = this.width/2;
	this.ball.y = this.paddle.y - this.ball.radius - 8;
	this.ball.a = Math.PI/3;

	if (this.scene > 3){ //won or lost - reset everything
		this.num_bricks = 0;
		for (var x = 0; x < 10; x++){
			for (var y = 0; y < 10; y++){
				if (this.bricks[x][y].type > 0){
					this.bricks[x][y].visible = true;
					this.bricks[x][y].hp = this.bricks[x][y].hp_orig;
					this.num_bricks++;
				}
			}
		}
		this.lives = 3;
	}
	this.scene = 1;
}

Game.prototype.handle_keyhit = function(e){
	var key = e.which || e.keyCode, handled = true;
	switch (key){
	case 13:	//enter
		if (this.scene === 0)	//not started
			this.scene = 1;
		else if (this.scene > 2)	//died or finished
			this.reset();
		break;
	case 37:	//left
		if (this.scene === 1){
			if (this.paddle.events.indexOf("move_left") === -1)
				this.paddle.events.push("move_left");
		}
		break;
	case 39:	//right
		if (this.scene === 1){
			if (this.paddle.events.indexOf("move_right") === -1)
				this.paddle.events.push("move_right");
		}
		break;
	default: handled = false;
	}
	if (handled === true){
		e.preventDefault(); e.stopPropagation();
	}
}

Game.prototype.handle_keyup = function(e){
	var key = e.which || e.keyCode;
	if (this.scene === 1){	//playing
		switch (key){
		case 37:	//left
			this.paddle.events.eradicate("move_left");
			break;
		case 39:	//right
			this.paddle.events.eradicate("move_right");
			break;
		}
	}
}

Game.prototype.update = function(dt){
	if (this.scene === 1){
		var x, y, paddle = this.paddle, ball = this.ball, brick, proj, hit, dist, norm, temp;
		//paddle
		if (paddle.events.length > 0){
			if (paddle.events[paddle.events.length-1] === "move_left"){
				paddle.spd -= paddle.acc*dt;
			}else if (paddle.events[paddle.events.length-1] === "move_right"){
				paddle.spd += paddle.acc*dt;
			}
		}else{	//not moving
			if (paddle.spd < 0){
				paddle.spd += paddle.acc*2*dt;
				if (paddle.spd > 0)
					paddle.spd = 0;
			}
			else if (paddle.spd > 0){
				paddle.spd -= paddle.acc*2*dt;
				if (paddle.spd < 0)
					paddle.spd = 0;
			}
		}
		if (paddle.spd > paddle.maxSpd)
			paddle.spd = paddle.maxSpd;
		else if (paddle.spd < -paddle.maxSpd)
			paddle.spd = -paddle.maxSpd;
		
		paddle.x += paddle.spd*dt;
		
		if (paddle.x < 0){
			paddle.x = 0;
			paddle.spd = 0;
		}else if (paddle.x+paddle.width >= 800){
			paddle.x = this.width-paddle.width;
			paddle.spd = 0;
		}

		//ball
		ball.a %= Math.TAU;

		ball.x += Math.cos(ball.a)*ball.spd*dt;
		ball.y += Math.sin(ball.a)*ball.spd*dt;

		//collide with borders
		if (ball.left < 0){
			ball.x = ball.radius;
			ball.a = Math.PI-ball.a;
		}else if (ball.right >= this.width){
			ball.x = this.width-ball.radius;
			ball.a = Math.PI-ball.a;
		}
		if (ball.top < 0){
			ball.y = ball.radius;
			ball.a = Math.TAU-ball.a;
		}else if (ball.top >= this.height){	//die
			this.scene = --this.lives > 0 ? 3 : 5;
		}

		//ball-paddle collision
		if (ball.right >= paddle.x && ball.left < paddle.x+paddle.width){
			if (ball.bottom >= paddle.y){
				ball.y = paddle.y-ball.radius;
				ball.a = Math.TAU-ball.a-paddle.spd*Math.PI/20/paddle.maxSpd;
			}
		}

		//ball-brick collision
		proj = [0, 0]; //projection vector
		for (x = 0; x < 10; x++){
			for (y = 0; y < 10; y++){
				brick = this.bricks[x][y];
				if (brick.type <= 0 || brick.visible === false)
					continue;
				hit = false
				dist = 0 //amount overlapping
				norm = 0 //normal of collision

				if (ball.x < brick.left){ //to the left
					if (ball.y < brick.top){	//above
						dist = Math.sqrt(Math.pow(ball.x-brick.left, 2) + Math.pow(ball.y-brick.top, 2));
						if (dist < ball.radius){
							hit = true;
							norm = Math.atan2(brick.top-ball.y, brick.left-ball.x);
						}
					}else if (ball.y >= brick.bottom){	//below
						dist = Math.sqrt(Math.pow(ball.x-brick.left, 2) + Math.pow(ball.y-brick.bottom, 2));
						if (dist < ball.radius){
							hit = true;
							norm = Math.atan2(brick.bottom-ball.y, brick.left-ball.x);
						}
					}else {	//in line
						if (ball.right >= brick.left){	//colliding
							hit = true;
							dist = ball.right-brick.left;
							norm = Math.PI;
						}
					}
				}else if (ball.x >= brick.right){	//right
					if (ball.y < brick.top){	//above
						dist = Math.sqrt(Math.pow(ball.x-brick.right, 2) + Math.pow(ball.y-brick.top, 2));
						if (dist < ball.radius){
							hit = true;
							norm = Math.atan2(brick.top-ball.y, brick.right-ball.x);
						}
					}else if (ball.y >= brick.bottom){	//below
						dist = Math.sqrt(Math.pow(ball.x-brick.right, 2) + Math.pow(ball.y-brick.bottom, 2));
						if (dist < ball.radius){
							hit = true;
							norm = Math.atan2(brick.bottom-ball.y, brick.right-ball.x);
						}
					}else{ //in line
						if (ball.left < brick.right){	//colliding
							hit = true;
							dist = brick.right-ball.left;
							norm = 0;
						}
					}
				}else if (ball.y < brick.top){	//above
					if (ball.bottom >= brick.top){
						hit = true;
						dist = ball.bottom-brick.top;
						norm = -Math.PI/2;
					}
				}else if (ball.y >= brick.bottom){	//below
					if (ball.top < brick.bottom){
						hit = true;
						dist = brick.bottom-ball.top;
						norm = Math.PI/2;
					}
				}else{	//in the brick
					if (ball.x-brick.left < ball.y-brick.top && ball.x-brick.left < brick.bottom-ball.y){	//closest to left
						hit = true;
						dist = ball.right-brick.left;
						norm = Math.PI;
					}else if (ball.x-brick.right >= ball.y-brick.top && ball.x-brick.right >= brick.bottom-ball.y) {	//closest to right
						hit = true;
						dist = brick.right-ball.x;
						norm = 0;
					}else if (ball.y < brick.mid_y){	//closest to top
						hit = true;
						dist = brick.top-ball.bottom;
						norm = -Math.PI/2;
					}else{	//closest to bottom
						hit = true;
						dist = ball.top-brick.bottom;
						norm = Math.PI/2;
					}
				}

				if (hit === true){
					brick.colliding = true;
					temp = Math.cos(norm)*dist;
					if ((temp < 0 && proj[0] < 0) || (temp > 0 && proj[0] > 0)){
						if (temp > proj[0])
							proj[0] = temp;
					}else{
						proj[0] += temp;
					}
					temp = Math.sin(norm)*dist;
					if ((temp < 0 && proj[1] < 0) || (temp > 0 && proj[1] > 0)){
						if (temp > proj[1])
							proj[1] = temp;
					}else{
						proj[1] += temp;
					}
				}else{
					if (brick.colliding === true){
						brick.colliding = false
						if (brick.type === 1){
							if (--brick.hp <= 0){
								brick.visible = false;
								if (--this.num_bricks <= 0)	//won
									this.scene = 4;
							}
						}
					}
				}
			}
		}
		if (proj[0] > 0 || proj[1] > 0){
			ball.x += proj[0];
			ball.y += proj[1];
			norm = Math.atan2(proj[1], proj[0]) % Math.TAU;
			if (Math.abs(norm-ball.a) > Math.PI/2)
				ball.a = 2*norm + Math.PI - ball.a;
		}
	}
	
	this.render();
}

Game.prototype.render = function(){
	var ctx = this.ctx, x, y, brick, lineWidth;
	
	//background
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, this.width, this.height);

	//paddle
	ctx.beginPath();
	ctx.rect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
	ctx.fillStyle = this.paddle.fill;
	ctx.fill();
	ctx.lineWidth = this.paddle.strokeWidth;
	ctx.strokeStyle = this.paddle.stroke;
	ctx.stroke();

	//bricks
	for (x = 0; x < 10; x++){
		for (y = 0; y < 10; y++){
			brick = this.bricks[x][y];
			if (brick.type > 0 && brick.visible === true){
				lineWidth = brick.hp*2-1;
				ctx.beginPath();
				ctx.rect(brick.left+lineWidth/2, brick.top+lineWidth/2, brick.width-lineWidth, brick.height-lineWidth);
				ctx.fillStyle = this.colours[0][brick.colour];
				ctx.fill();
				ctx.lineWidth = lineWidth;
				ctx.strokeStyle = this.colours[1][brick.colour];
				ctx.stroke();
			}
		}
	}

	//ball
	ctx.beginPath();
	ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, 2*Math.PI);
	ctx.fillStyle = this.ball.fill;
	ctx.fill();
	ctx.lineWidth = this.ball.strokeWidth;
	ctx.strokeStyle = this.ball.stroke;
	ctx.stroke();

	//text
	ctx.textAlign = "center";
	ctx.fillStyle = "#ffffff";
	if (this.scene === 0){	//start
		ctx.font = "Bold 40pt Courier";
		ctx.fillText("Press Enter to begin", 400, 300);
	}else if (this.scene === 2){	//paused
		ctx.font = "Bold 40pt Courier";
		ctx.fillText("Paused...", 400, 300);
	}else if (this.scene === 3){ //died
		ctx.font = "Bold 40pt Courier";
		ctx.fillText("Oopsie!", 400, 300);
		ctx.font = "Bold 20pt Courier";
		ctx.fillStyle = "#bfbfbf";
		ctx.fillText("You now have " + this.lives + " " + (this.lives === 1 ? "life" : "lives") + " remaining", 400, 340);
	}else if (this.scene > 3){	//won or lost
		ctx.font = "Bold 40pt Courier";
		ctx.fillText(this.scene === 4 ? "You Win!" : "GAME OVER", 400, 300);
		ctx.font = "Bold 20pt Courier";
		ctx.fillStyle = "#bfbfbf";
		ctx.fillText("Press Enter to play again", 400, 340);
	}
}

window.onload = function(){
	game = new Game();
}
