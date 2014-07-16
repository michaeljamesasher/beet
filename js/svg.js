/*

thanks to
http://bl.ocks.org/mbostock/6123708

inspiration 
http://bl.ocks.org/benzguo/4370043
http://bl.ocks.org/mbostock/3750558
http://bl.ocks.org/cjrd/6863459
http://bl.ocks.org/robschmuecker/7880033

*/


var margin = {top: -5, right: -5, bottom: -5, left: -5},  
    width = document.getElementById('graphBox').getBoundingClientRect().width - margin.left - margin.right,
    height = document.getElementById('graphBox').getBoundingClientRect().height - margin.top - margin.bottom;

var zoom = d3.behavior.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", zoomed);

var drag = d3.behavior.drag()
    .origin(function(d) { return {x: d.get('x'),y: d.get('y')} })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

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

var blockBox = d3.select("#graphBox").append('div').attr('class','blockBox');
var $blockBox = $(blockBox[0]);

function plot(blocks){

    dot = container
      .selectAll("g")
      .data(blocks.models)
      .enter().append("g")
      .each(function(d,i){
        new SVGBlockView({ model: d, el: this});
        // new BlockView({ model: d});
      });
      // .attr("width", 20)
      // .attr("height", 20)
      // .attr("x", function(d) { return d.get('x'); })
      // .attr("y", function(d) { return d.get('y'); })
      // .call(drag);
}

function zoomed() {
  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dragged(d) {
  d.set('x', d3.event.x);
  d.set('y', d3.event.y);
  d3.select(this).attr("transform", function(d) { return 'translate(' + d.get('x') +',' + d.get('y') + ')'; })
  // .attr("x", d3.event.x).attr("y", d3.event.y);
}

function dragended(d) {
  d3.select(this).classed("dragging", false);
}