/*
thanks to
http://bl.ocks.org/mbostock/6123708

inspiration 
http://bl.ocks.org/benzguo/4370043
http://bl.ocks.org/mbostock/3750558 //TODO force layout
http://bl.ocks.org/cjrd/6863459
http://bl.ocks.org/mccannf/1629464
http://bl.ocks.org/robschmuecker/7880033
http://bl.ocks.org/explunit/5603250
http://bl.ocks.org/mbostock/929623
http://codepen.io/billdwhite/pen/lCAdi

*/

// d3 SVG based panning and dragging
//=======================================

var margin = {top: 0, right: 0, bottom: 0, left: 0},  
    width = document.getElementById('graphBox').getBoundingClientRect().width - margin.left - margin.right,
    height = document.getElementById('graphBox').getBoundingClientRect().height - margin.top - margin.bottom;

var zoom = d3.behavior.zoom()
    .scaleExtent([0.5, 5])
    .on("zoom", zoomed);

var drag = d3.behavior.drag()
    .origin(function(d) { return {x: d.get('x'),y: d.get('y')} }) //TODO d3.slect(this).attr('x')?
    .on("dragstart", dragstartedBlock)
    .on("drag", draggedBlock)
    .on("dragend", dragendedBlock);

var svg = d3.select("#graphBox").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
    .call(zoom);

var rect = svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all");

var container = svg.append("g")
    .attr("class", "dot");

var blockBox = d3.select("#graphBox").append('div').attr('id','blockBox');
var $blockBox = $(blockBox[0]);

function zoomed() {
  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
  panZoom.set('zoom',d3.event.scale);
  panZoom.set('x',d3.event.translate[0]);
  panZoom.set('y',d3.event.translate[1]);
}

function dragstartedBlock(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
  d3.selectAll('.block').classed('invisible',true);
}

function draggedBlock(d) {
  if(!isNaN(d3.event.x) && !isNaN(d3.event.y)){
    d3.select(this).attr("transform", function(d) { return 'translate(' + d3.event.x +',' + d3.event.y + ')'; })
    d.set('x', d3.event.x);
    d.set('y', d3.event.y);
    // TODO move 'shadow' svg then move actual element on dragend
  }
}

function dragendedBlock(d) {
  d3.selectAll('.block').classed('invisible',false);
  d3.select(this).classed("dragging", false);
}

function drawLinkPath(x,y,x2,y2){
  return "M" + x +"," + y
    + "S" + ((x+x2)/2) +"," + y2+',' 
    + x2 +"," + y2;
}

function addLink(from, to, input){
   var linkModel = new Backbone.Model({
    blockFrom: from,
    blockTo: to ,
    inputTo: input
  }); 
  new LinkView({model: linkModel})
  //TODO add links to blockFrom collection - deal with toJSON ramifications
}

var linkEnd = null; 
var linkDrawer = d3.svg.diagonal();
var linkPath = container.append('path').attr('class','link temp');  
var dragLink = d3.behavior.drag()
    .origin(function(d) { return {x: d.x,y: d.y} })
    .on("dragstart", dragstartedLink)
    .on("drag", draggedLink)
    .on("dragend", dragendedLink);

function dragstartedLink(d){
  d3.event.sourceEvent.stopPropagation();
  d3.event.sourceEvent.preventDefault();
}

function draggedLink(d){
  linkPath.attr('d',drawLinkPath(d.x,d.y,
                                d3.event.x, d3.event.y));
}
function dragendedLink(d){
  if (_.isNull(linkEnd)) linkPath.attr('d','');
  else {
    linkPath.attr('d','');
    addLink(d.model,linkEnd.model,linkEnd.input)
  };
}