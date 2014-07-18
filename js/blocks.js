// helper functions
//=======================================

// thanks http://www.mattsnider.com/parsing-javascript-function-argument-names/
function getParamNames(fn) {
    var funStr = fn.toString();
    return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
    // return args.map(function(arg){ return {} });
}

//thanks to http://stackoverflow.com/questions/8618464/how-to-wait-for-another-js-to-load-to-proceed-operation
// _.defer didn't always work
function whenAvailable(name, context, callback) {
    var interval = 0; // ms
    function callUntil(){
      if (context[name]) {
            callback();
            // callback(window[name]);
        } else {
            setTimeout(callUntil, interval);
        }
    }
    setTimeout(callUntil, interval);
}

// underlying SVG for block
//=======================================

var SVGBlockView = Backbone.View.extend({
  initialize: function(){
    this.model.SVGView = this;
    this.model.on('change', this.render, this);   // TODO only necessary for inputs   
    this.model.on('remove', this.remove, this);      
    this.render();
  },
  events: {
    'click .remove' : function(){ this.destroy(); },
  },
  drawLinks: function(){
      var model = this.model;
      var links = model.get('links') || [];
      // console.log('links', links)

      container.selectAll('path.link')
          .data(links).enter()
          .append('path').attr('class','link')
          .attr('d', function(d){
            // TODO don't hardcode path? - have BlockModel.inputPosition()
            var blockTo = blocks.get(d.id);
            junk =blockTo;
            console.log(blockTo.get('inputs'),d.input);
            var yTo = blockTo.get('y') + 30 +32*_.indexOf(blockTo.get('inputs'),d.input);
            var path = "M" + (model.get('x')+100) +"," + (model.get('y')+32) 
              + "L" + blockTo.get('x') +"," + yTo;
              console.log(path,d.id,model.cid);
              return path;
          });
  
            // .attr("transform", function(d,i) { 
            //   return 'translate(0,' + (32 + 30*i) + ')'; 
            // })

    // link.attr("d", function(d) {
    //   return "M" + d[0].x + "," + d[0].y
    //       + "S" + d[1].x + "," + d[1].y
    //       + " " + d[2].x + "," + d[2].y;
    // });
  },
  render : function(){
    var model = this.model;
    var d3el = d3.select(this.el) // http://collaboradev.com/2014/03/18/d3-and-jquery-interoperability/
      .attr("transform", function(d) { 
        return 'translate(' + model.get('x') +',' + model.get('y') + ')'; 
      })
      .attr("cursor", "move")
      .call(drag) // note data is passed as argument to drag
      
    var rect = d3el.selectAll('rect')
    if (rect.empty()){
      d3el.append('rect')
        .attr("width", 100)
        .attr("height", 100);
    }

    d3el.selectAll('text').remove();
    d3el.append('text')
      .attr('font-family', 'beet')
      .attr('font-size', function(d) { return 25; } )
      .attr("transform", 'translate(90,10)')
      .text(function(d) { return '' })
      .attr('class','remove')
      .attr('cursor','default');
      // .on('click', function(){ view.destroy(); });
    

    var inputs = model.get('inputs');
    if (! _.isEmpty(inputs)){
      d3el.selectAll('g.input').remove();
       
      var inputBoxes = d3el.selectAll('g.input')
            .data(inputs)
            .enter().append('g')
            .attr('class','input')
            .attr('id', function(d){ return d; })
            .attr("transform", function(d,i) { 
              return 'translate(0,' + (32 + 30*i) + ')'; 
            })
            .on("mousedown", function(d){ d3.event.stopPropagation();  }) //TODO check
            .on("dragstart", function(d){ })
            // .on("drag", function(d){ 
            //   container.append('path')
            //     .attr("class", "link")
            //     .attr("d", function(d){})
            //     ;
            //   })
            // .on("dragend", function(d){ d3.event.stopPropagation(); })
            .on('click', function(){ console.log('punk'); })
            .attr('cursor','crosshair');

      inputBoxes.append('rect')
        .attr("width", 24)
        .attr("height", 24)
        .attr("y", -12)
        .attr("x", -12)

      inputBoxes.append('circle')
        .attr('cx',-10)
        .attr('r',10);

      inputBoxes.append('text')
        .text(function(d){return d}).attr('font-size', 10)
        .attr("transform", function(d,i) { 
          return 'translate(' + ( -12 -d3.select(this).node().getComputedTextLength() ) + ',0)'; 
        });
    }

    d3el.append('g')
    .attr('class','output')
    .attr("transform", function(d,i) { 
      return 'translate(100 , 32)'; 
    })
    .on("mousedown", function(d){ d3.event.stopPropagation();  }) //TODO check
    .attr('cursor','crosshair')
    .on("mousedown", function(d){ d3.event.stopPropagation();  })
    .append('circle').attr('r',10);


  },

  destroy : function(){
    blocks.remove(this.model);
    _.each(blocks.models,function(m){ m.trigger('change'); }); // hack to stop iframes jumping around
    // this.remove();
  }
});

// iframe for block
//=======================================

var BlockView = Backbone.View.extend({
  initialize: function(){
    this.model.on('change', this.move, this);    
    this.model.on('remove', this.remove, this);
    panZoom.on('change', this.move, this);     
    this.render();
  },

  // template : _.template("<iframe scrolling='no' src='<%= main %>'></iframe>"),
  template : _.template("<iframe ></iframe>"),

  move: function(){
    this.$el.offset({
        top: panZoom.get('y')+(this.model.get('y')+20)*panZoom.get('zoom'),
        left: panZoom.get('x')+(this.model.get('x'))*panZoom.get('zoom')
    });
    this.$el.height(80*panZoom.get('zoom'));
    this.$el.width(100*panZoom.get('zoom'));
  },

        // TODO 1. call main when inputs change

  render: function(){
      var model = this.model;

      this.$el.addClass('block').html(this.template(this.model.attributes)).appendTo($blockBox)
      this.move(); // TODO render->initialize, move->render?
      // this.$el.height(80);
      // this.$el.width(100);
      // this.$el.offset({top: this.model.get('y')+20, left: this.model.get('x')});
      // TODO http://jsfiddle.net/Th75t/7/
      // this.$el.resizable();

      var inner = this.$el.find('iframe')[0].contentWindow;

      var $html = this.$el.find('iframe').contents().find('html');

      // get iframe
      //      rather than setting src=this.model.get('main'), to avoid cross origin restriction
      $.get( this.model.get('main'), function( pageHtml ) {
        
            
        // append script to wrap main in iframe as to let parent know when main is called 
        // 2. update output when main is called
        pageHtml = pageHtml.replace(/<\s*\/\s*script\s*>/g,'</script>')
        var position = pageHtml.lastIndexOf("<\/script");
        var wrapMain = _.template($('#wrapMain').html())({
                                                        id: model.cid,
                                                        open: '<script>',
                                                        close: '<\/script>',
                                                        });
        var newHtml = [pageHtml.slice(0, position), wrapMain , pageHtml.slice(position)].join('');
        
        inner.document.open();
        inner.document.writeln(newHtml);
        inner.document.close();

        // junk iframe just to find how many arguments main has/had
        var junkIframe = $('<iframe />').appendTo('#junkIframes');
        var innerJunk = junkIframe[0].contentWindow;
        innerJunk.document.open();
        innerJunk.document.writeln(pageHtml);
        innerJunk.document.close();

        whenAvailable('main', innerJunk, function(){
          model.set('inputs', getParamNames(innerJunk.main) ); 
          junkIframe.remove();
        });


      });

      return this;
  } 
});

// initialize models and views
//=======================================
// _id, inputs, inputValuse, output, links, x, y, main
var BlockModel = Backbone.Model.extend({
  toJSON: function() {
    var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
    json._id = this.cid;
    return json;
  },
  // inputPosition: function(input){
  //   var inputs = this.get('inputs');
  //   console.log("dogg",inputs,input,this.cid)
  //   return 32 + 30*_.indexOf(inputs,input);
  // }
});

var BlockCollection = Backbone.Collection.extend({ 
  model: BlockModel,
}); 

var blocks = new BlockCollection();

function addBlock(block){
    container
      .append("g")
      .data([block])
      .each(function(d,i){
        // console.log("add", d, this)
        new SVGBlockView({ model: d, el: this});
        new BlockView({ model: d});
      });
}

PanZoom = Backbone.Model.extend({
  defaults: {
    "x":  0,
    "y":  0,
    "zoom": 1,
  }
});

var panZoom = new PanZoom;

$(document).ready(function(){

  blocks.fetch({
             url:'/graph/data/init.json', 
             success: function(collection){ 

              _.each(collection.models, addBlock); 
              
              // sort _id   
              _.each(collection.models,function(model){
                var links = model.get('links') || [];
                for (var i = 0; i < links.length; i++) {
                  _.each(collection.models,function(otherModel){
                    if (links[i].id == otherModel.get('_id')){
                      links[i].id = otherModel.cid;
                    }
                  });
                };
                model.set('links',links); // TODO linkmodel with view
              })

              //TODO make sure inputs are set
              _.each(collection.models, function(block){ block.SVGView.drawLinks(); });

            },
             error: function(collection, response, options){ console.log("error loading graph"); },
            });

  //TODO when links.fetch use _id


  setTimeout(function(){

// TODO put this all (including adBlock in the initialize)
    var block = new BlockModel({"x": 100, "y":100, "main": "/graph/pages/jquery-ui-slider.html"});
    blocks.add(block);
    addBlock(block);

  }, 1000); // fetch resets the collection

  // addBlock({ "x": 100, "y":280, "main": "/graph/pages/jquery-ui-slider.html"});
  // addBlock({ "x": 280, "y":280, "main": "/graph/pages/js.html"});


})
