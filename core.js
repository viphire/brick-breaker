//usage:
// * define Game.prototype.init() and Game.prototype.update(dt)
// * game = new Game()

Math.TAU = Math.PI * 2;

function Game(options){
	var is3d = false;
	if (options){
		is3d = options.is3d;
	}
	//graphics
	this.width = 800; this.height = 600;
	this.canvas = document.getElementById("game-window");
	this.canvas.width = this.width; this.canvas.height = this.height;
	if (is3d){
		//2d setup
		this.canvas2d = document.createElement("canvas");
		this.canvas2d.id = "game-overlay";
		this.canvas2d.style.position = "absolute";
		this.canvas2d.style.left = "0px"; this.canvas2d.style.top = "0px";
		this.canvas2d.width = this.width; this.canvas2d.height = this.height;
		this.canvas.style.zIndex = 1; this.canvas2d.style.zIndex = 2;
		this.canvas2d.style.background = "transparent";
		this.canvas.parentNode.appendChild(this.canvas2d);
		this.ctx = this.canvas2d.getContext("2d");
	}else{
		this.ctx = this.canvas.getContext("2d");
	}
	this.dt_max = 1/30;
	this.anim_ref = null;
	this.progress = 0;
	this.update_cb = this._update.bind(this);
	this.init();
	this.run();
}

Game.prototype.run = function(){
	if (this.progress > 0)
		this.progress -= 1;
	else{
		if (this.anim_ref === null)
			this.anim_ref = window.requestAnimationFrame(this.update_cb);
	}
}

Game.prototype._update = function(now){
	if (!this.now)
		this.now = now;
	var dt = Math.min((now - this.now)/1000, this.dt_max);
	this.now = now;
	
	if (this.update(dt))	//update should return true for 'done'
		this.anim_ref = null;
	else
		this.anim_ref = window.requestAnimationFrame(this.update_cb);
}
