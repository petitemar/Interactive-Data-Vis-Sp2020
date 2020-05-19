/**
 * CONSTANTS AND GLOBALS
 * */
var
	height = document.documentElement.clientHeight * 0.75,
  width = height,
  margin = { top: 20, bottom: 50, left: 60, right: 40 };

let svg;
let tooltip;

/**
 * APPLICATION STATE
 * */
let state = {
  data: null,
  hover: null,
  mousePosition: null
};

/**
 * LOAD DATA
 * */
d3.json("./flare.json", d3.autotype).then(data => {
  state.data = data;
  init();
});

/**
 * INITIALIZING FUNCTION
 * this will be run *one time* when the data finishes loading in
 * */
function init() {
  const container = d3.select("#d3-container")
  	.style("position", "relative")
  	.style("width", width+"px")
  	.style("height", height+"px")
  	.style("margin", "0 auto");

  tooltip = container
    .append("div")
    .attr("class", "tooltip")
    .attr("width", 100)
    .attr("height", 100)
    .style("position", "absolute");

  svg = container
    .append("svg")
    .attr("viewBox", "0 0 "+ width + " " + height)
    .attr("id", "svgContainer");

  const colorScale = d3.scaleOrdinal(d3.schemeSet3);

  // make hierarchy
  const root = d3
    .hierarchy(state.data) // children accessor
    .sum(d => d.value) // sets the 'value' of each level
    .sort((a, b) => b.value - a.value);

  // make treemap layout generator
  const pack = d3
    .pack()
    .size([width, height]);

  // call our generator on our root hierarchy node
  pack(root); // creates our coordinates and dimensions based on the heirarchy and tiling algorithm
 	window.data = root;
  // create g for each leaf
  const leaf = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g");
//    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  leaf
    .append("circle")
    .attr("stroke", "rgba(0,0,0,0.2)")
    .style("fill", function(d) {
      const level1Ancestor = d.ancestors().find(d => d.depth === 1);
      return colorScale(level1Ancestor.data.name);
    })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", function(d) { return d.r; })
    .on("mouseover", function(d) {
			d3.select(this).style("fill", function() {
        return d3.rgb(d3.select(this).style("fill")).darker(0.3);
    	});
      state.hover = {
        translate: [
          // center top left corner of the tooltip in center of tile
          d.x,
          d.y
        ],
        name: d.data.name,
        value: d.data.value,
        title: `${d
          .ancestors()
          .reverse()
          .map(d => d.data.name)
          .join("/")}`,
      };
      draw();
    })
    .on("mouseout", function(d) {
			d3.select(this).style("fill", d => {
	      const level1Ancestor = d.ancestors().find(d => d.depth === 1);
 	    	return colorScale(level1Ancestor.data.name);
    	});
    	state.hover = null;
    	draw();
    });

  draw(); // calls the draw function
}

/**
 * DRAW FUNCTION
 * we call this everytime there is an update to the data/state
 * */
function draw() {
  if (state.hover !== null) {
    tooltip
      .html(
        `
        <div><span class="bold">Name:</span> ${state.hover.name}</div>
        <div><span class="bold">Value:</span> ${state.hover.value}</div>
        <div><span class="bold">Hierarchy Path:</span> ${state.hover.title}</div>
      `
      )
      .transition()
      .duration(500)
      .style(
        "transform",
        `translate(${state.hover.translate[0]}px,${state.hover.translate[1]}px)`
      );
  }
}

function resize() {
	height = document.documentElement.clientHeight * 0.75; 
	width = height;
  d3.select("#d3-container")
  	.style("width", width+"px")
  	.style("height", height+"px");
}

window.onresize = function () {
	resize();
}
