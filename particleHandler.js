const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");

ctx.canvas.width  = window.innerWidth - 4;
ctx.canvas.height = window.innerHeight - 4;

let particleArray;

let moveEvent = ["!repel", "!connect", "grow"];
let clickEvent = ["add", "!connect"]; 

let growRadius = 100;
let maxGrowthSize = 25;

let repelRadius = 200;
let repelForce = 2; // May cause jittering if number is larger

let connectDistance = 10;

let speed = 1;
let amount = 2;
let density = 35; // The larger the density the less dense each node is

let lineWidth = 1;
let numberOfSides = 15; // Min - 3

let minSize = 2;
let maxSize = 5;
let particleSize = 7.5;
let randomizeSize = true;

let minOpacity = .25; // 0 - 1
let maxOpacity = .5; // 0 - 1
let particleOpacity = 1; // 0 - 1
let randomizeOpacity = false;

let particleColour = "255, 255, 255";
let lineColour = "255, 255, 255";

let linkNodes = true;
let bounce = false; // May cause flashing | Not to brag but it kinda looks cool | Maybe increase size of canvas to hide it

let amountToAdd = 3;
let addedParticles = 0;

// Values are .75 to normalize the movement speed
let directions = {
  "Random": [0, 0],
  "Top": [0, -1],
  "Top Right": [.75, -.75],
  "Right": [1, 0],
  "Bottom Right": [.75, .75],
  "Bottom": [0, 1],
  "Bottom Left": [-.75, .75],
  "Left": [-1, 0],
  "Top Left": [-.75, -.75],
};

let direction = "Bottom Left";
let movementVariation = .5;

// get mouse mouse position
let mouse = {
	x: null,
	y: null,
  //sizeRadius: ((canvas.height / 80) * (canvas.width / 80) * (sizeRadius / 5)) // Still need this for some reason
}

window.addEventListener('mousemove',
	function(event){
		mouse.x = event.x;
		mouse.y = event.y;
  }
);

window.addEventListener("mousedown", 
  function() {
    if(clickEvent.includes("add")) {
      addNodes();
    }

    if(clickEvent.includes("connect")) {
      connectToMouse(); // Doesn't work?
    }
  }
);

// create Particle
class Particle {
  constructor(x, y, directionX, directionY, size, colour, opacity) {
    this.x = x;
    this.y = y;
    this.directionX = directionX;
    this.directionY = directionY;
    this.size = size;
    this.minSize = size;
    this.maxSize = size + maxGrowthSize;
    this.colour = colour;
    this.opacity = opacity;
    this.density = Math.random() * density;
  }

  // create method to draw individual particle
  draw() {
    ctx.globalCompositeOperation='destination-over';
    ctx.beginPath();

    ctx.moveTo (this.x + this.size * Math.cos(0), this.y +  this.size *  Math.sin(0));          

    for (var i = 1; i <= numberOfSides;i += 1) {
      ctx.lineTo (this.x + this.size * Math.cos(i * 2 * Math.PI / numberOfSides), this.y + this.size * Math.sin(i * 2 * Math.PI / numberOfSides ));
    }

    ctx.fillStyle = 'rgba(' + this.colour + ',' + this.opacity + ')';
    ctx.fill();
  }

  deleteObject() {
    particleArray.splice(particleArray.indexOf(this), 1);
    addedParticles--;
  }

  withinRange(distance, radius) {
    return distance < radius + this.size;
  }

    // check particle position, check mouse position, move the paticle, draw the particle
  update() {
    // check if particle is still within canvas
    if(bounce) {
      if(this.x + this.size > canvas.width || this.x + this.size < 0) {
        if(addedParticles > 0) this.deleteObject();
        this.directionX = -this.directionX;
      }
      if(this.y + this.size > canvas.height || this.y - this.size < 0) {
        if(addedParticles > 0) this.deleteObject();
        this.directionY = -this.directionY;
      }
    }
    else {
      if (this.x + this.size > canvas.width) {
        if(addedParticles > 0) this.deleteObject();
        this.x = this.x - canvas.width;
      } 
      else if(this.x + this.size < 0) {
        this.x = this.x + canvas.width;
      }

      if (this.y + this.size > canvas.height) {
        if(addedParticles > 0) this.deleteObject();
        this.y = this.y - canvas.height
      }
      else if (this.y - this.size < 0) {
        if(addedParticles > 0) this.deleteObject();
        this.y = this.y + canvas.height
      }
    }
    
    // check mouse position/particle position - collision detection
    let dx = mouse.x - this.x;
    let dy = mouse.y - this.y;
    let distance = Math.hypot(dx, dy);
    let forceX = dx / distance;
    let forceY = dy / distance;
    let maxDist = repelRadius;
    let force = ((maxDist - distance) / maxDist) * repelForce;
    let directionX = forceX * force * this.density;
    let directionY = forceY * force * this.density;

    if(moveEvent.includes("repel")) {
      if (this.withinRange(distance, repelRadius)) {    
        this.x -= directionX;
        this.y -= directionY;
      }
    }
    
    // move particle
    this.x += this.directionX;
    this.y += this.directionY;
    // call draw method
    this.draw();
  }
}

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function addNodes() {
  let enableRepel = false;
  if(moveEvent.includes("repel")) {
    enableRepel = true;
    moveEvent[moveEvent.indexOf("repel")] = "!repel"
  }

  for(let i = 0; i < amountToAdd; i++) {
    createParticle(mouse.x, mouse.y);
    addedParticles++;
  }

  if(enableRepel) {
    enableRepel = false;
    setTimeout(() => {moveEvent[moveEvent.indexOf("!repel")] = "repel"}, 100)
  }
}

// check if particles are close enough to draw line between them
function connect() {
  let opacityValue = 1;
  for (let a = 0; a < particleArray.length; a++) {
    for (let b = a; b < particleArray.length; b++) {
      let dx = particleArray[a].x - particleArray[b].x;
      let dy = particleArray[a].y - particleArray[b].y;
      let distance = (dx * dx) + (dy * dy);
      if (distance < (canvas.width/7) * (canvas.height/7))
      {   
        opacityValue = 1 - (distance / 10000);
        ctx.strokeStyle = 'rgba(' + lineColour + ',' + opacityValue +')';
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.moveTo(particleArray[a].x, particleArray[a].y);
        ctx.lineTo(particleArray[b].x, particleArray[b].y);
        ctx.stroke();
      }    
    }
  }
}

function connectToMouse() {
  let opacityValue = 1;
    for (let a = 0; a < particleArray.length; a++) {
      let dx = particleArray[a].x - mouse.x;
      let dy = particleArray[a].y - mouse.y;
      let distance = ((dx * dx) + (dy * dy)) / connectDistance;
      if (distance < (canvas.width/7) * (canvas.height/7))
      {   
        opacityValue = 1 - (distance / 10000);
        ctx.strokeStyle = 'rgba(' + lineColour + ',' + opacityValue +')';
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.moveTo(particleArray[a].x, particleArray[a].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }    
    }
}

// create particle array 
function init(){
  particleArray = [];
  let numberOfParticles = ((canvas.height * canvas.width) * amount)/9000;
  for (let i = 0; i < numberOfParticles; i++){
    createParticle();
  }

  if(moveEvent.includes("shrink")) {
    setMaxSize();
  }
}

function createParticle(x = null, y = null) {
  //Math.random() * (max - min) + min
  let size = randomizeSize ? ((Math.random() * (maxSize - minSize)) + minSize) : particleSize;
  let opacity = randomizeOpacity ? Math.random() * (maxOpacity - minOpacity) + minOpacity : particleOpacity;
  let directionX = speed == 0 ? 0 : (directions[direction][0] + (((Math.random() * (1 - -1)) + -1) * movementVariation)) * speed;
  let directionY = speed == 0 ? 0 : (directions[direction][1] + (((Math.random() * (1 - -1)) + -1) * movementVariation)) * speed;
  x = x == null ? (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2) : x;
  y = y == null ? (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2) : y;
  
  particleArray.push(new Particle(x, y, directionX, directionY, size, particleColour, opacity));
}

function reset() {
  for(let x = 0; x < particleArray.length; x++) {
    particleArray[x].size = particleArray[x].minSize;
  }
}

// create animation loop
function animate(){
	ctx.clearRect(0, 0, innerWidth, innerHeight);
	
	for (let i = 0; i < particleArray.length; i++){
	  particleArray[i].update();
	}

  if(moveEvent.includes("connect")) connectToMouse();
  if(linkNodes) connect();

  requestAnimationFrame(animate);
}

init(); 
//particleArray = [];
//particleArray.push(new Particle(50, 50, 0, 0, 10, particleColour, 1));
animate();


// Empty and refill particle array every time window changes size + change canvas size
window.addEventListener('resize',
	function() {
		canvas.width = innerWidth;
		canvas.height = innerHeight;
		init();
	}
)
// Set mouse pos to null when it leaves the canvas
window.addEventListener('mouseout',
	function() {
		mouse.x = undefined;
	  mouse.y = undefined;

    reset();
	}
)