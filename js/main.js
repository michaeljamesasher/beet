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

TODO
titles for blocks
just include beet_wrap_main.js as a script in all blocks rather than being clever
update block on code change
window resize draw
gist save/load/fork
react.js views?
*/



// d3 SVG based panning and dragging
//=======================================

var margin = {top: 0, right: 0, bottom: 0, left: 0},  
    // width = document.getElementById('graphBox').getBoundingClientRect().width - margin.left - margin.right,
    width = document.body.getBoundingClientRect().width - margin.left - margin.right,
    height = document.body.getBoundingClientRect().height - margin.top - margin.bottom;

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

// http://logogin.blogspot.com.au/2013/02/d3js-arrowhead-markers.html
// svg.append("defs").append("marker")
//     .attr("id", "arrowhead")
//     .attr("refX", 0) /*must be smarter way to calculate shift*/
//     .attr("refY", 2)
//     .attr("markerWidth", 6)
//     .attr("markerHeight", 4)
//     .attr("orient", "auto")
//     .append("path")
//     .attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead

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
  panZoom.set('zoom',d3.event.scale); // TODO no longer needs to be a model
  panZoom.set('x',d3.event.translate[0]);
  panZoom.set('y',d3.event.translate[1]);
}

function dragstartedBlock(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.event.sourceEvent.preventDefault();
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

var linkEnd = null; 
var linkDrawer = d3.svg.diagonal();
var linkPath = container.append('path').attr('class','link temp');  
var dragLink = d3.behavior.drag()
    .origin(function(d) { return {x: d.get('x')+100, y: d.get('y')+32} })
    .on("dragstart", dragstartedLink)
    .on("drag", draggedLink)
    .on("dragend", dragendedLink);

function dragstartedLink(d){
  d3.event.sourceEvent.stopPropagation();
  d3.event.sourceEvent.preventDefault();
}

function draggedLink(d){
  linkPath.attr('d',drawLinkPath(d.get('x')+100, d.get('y')+32,
                                d3.event.x, d3.event.y))
        // .attr("marker-end", "url(#arrowhead)");
}

function dragendedLink(d){
  if (_.isNull(linkEnd)) linkPath.attr('d','M0,0'); //TODO stop d3 warning: Empty string passed to getElementById().
  else {
    linkPath.attr('d','M0,0');
    var link = new Backbone.Model({toId:linkEnd.toId, input:linkEnd.input, fromId:d.cid});
    d.get('links').add(link);
    new LinkView({model:link});
  };
}

var redragLink = d3.behavior.drag()
    // .origin(function(d) { return {x: d.x,y: d.y} })
    .on("dragstart", redragstartedLink)
    .on("drag", redraggedLink)
    .on("dragend", redragendedLink);

function redragstartedLink(d){
  d3.event.sourceEvent.stopPropagation();
  d3.event.sourceEvent.preventDefault();
  d.view.destroy();

}

function redraggedLink(d){
  linkPath.attr('d',drawLinkPath(blocks.get(d.get('fromId')).get('x')+100,blocks.get(d.get('fromId')).get('y')+32,
                                d3.event.x, d3.event.y));
}

function redragendedLink(d){
  linkPath.attr('d','M0,0');
  var links = blocks.get(d.get('fromId')).get('links');
  if(!_.isNull(linkEnd)){
    var link = new Backbone.Model({toId:linkEnd.toId, input:linkEnd.input, fromId:d.get('fromId')});
    links.add(link);
    new LinkView({model:link});
  }
  links.remove(d);
}

// var resize = d3.behavior.drag()
//     .on("drag", function(){
//       d3.select('#graphBox')
//       d3.event.x
//     });

// d3.select('#resize').call(resize)
// d3.select(window).on('resize', function(){
//   svg.attr('width',document.getElementById('graphBox').getBoundingClientRect().width )
//     .attr('height',document.getElementById('graphBox').getBoundingClientRect().height )

//   rect.attr('width',document.getElementById('graphBox').getBoundingClientRect().width- margin.left - margin.right )
//     .attr('height',document.getElementById('graphBox').getBoundingClientRect().height - margin.top - margin.bottom)

//   // var containerNew = svg.append("g")
//   //   .attr("class", "dot");

//   // _.each(container.selectAll('path')[0], function(el){
//   //   containerNew[0][0].appendChild(el);
//   // });
//   // _.each(container.selectAll('g')[0], function(el){
//   //   containerNew[0][0].appendChild(el);
//   // });
//   // container.remove();
//   // container = containerNew;

//     //todo we have to redraw the container!
// });

$('#resize .icon-right-open').click(function(){
  var mq = window.matchMedia('(min-width: 768px)');
  if (mq.matches){
      $('#menuBox').animate({
        left: '+=50%',
      })
  }
  else {
      $('#menuBox').animate({
        left: '+=100%',
      })
  }
  $('.selected').animate({
    left: '+=100%'
  })
});
$('#resize .icon-left-open').click(function(){
  var mq = window.matchMedia('(min-width: 768px)');
  if (mq.matches){
      $('#menuBox').animate({
        left: '-=50%',
      })
  }
  else {
      $('#menuBox').animate({
        left: '-=100%',
      })
  }
  $('.selected').animate({
    left: '-=100%'
  })
});

$('#file-image').click(function(){
  $('#editor').hide();
});

$('#file-code').click(function(){
  $('#editor').show();
});



// thanks to http://stackoverflow.com/questions/6219031/how-can-i-resize-a-div-by-dragging-just-one-side-of-it
