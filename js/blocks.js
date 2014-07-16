/*
Basic idea is to have each block an ordinary web page 
so we can use the wealth of javascript libraries out there 
and each block can be debugged independently.
The only strict format is that each block have somewhere a js function
named 'main' which takes the desired inputs and returns the output.
'main' will be called each time the inputs are changed.
To include interaction, simply include listeners which call main when
a user does something. 

*/


var SVGBlockView = Backbone.View.extend({
  initialize: function(){
    // this.model.on('change', this.render, this);      
    this.model.on('remove', this.remove, this);      
    this.render();
  },
  events: {
    'click .remove' : function(){ this.destroy(); },
  },
  render : function(){
    var model = this.model;
    var view = this;
    var d3el = d3.select(this.el) // http://collaboradev.com/2014/03/18/d3-and-jquery-interoperability/
      .attr("transform", function(d) { return 'translate(' + model.get('x') +',' + model.get('y') + ')'; })
      .call(drag) // drag on g so we can append text etc. 
      
    d3el.selectAll('rect').remove(); 
    d3el.append('rect')
      .attr("width", 100)
      .attr("height", 100);

    d3el.selectAll('text').remove();
    d3el.append('text')
      .text('X')
      .attr('class','remove');
      // .on('click', function(){ view.destroy(); });

  },

  destroy : function(){
    blocks.remove(this.model);
    _.each(blocks.models,function(m){ m.trigger('change'); }); // hack to stop iframes jumping around
    // this.remove();
  }
});


var BlockView = Backbone.View.extend({
  initialize: function(){
    this.model.on('change', this.move, this);    
    this.model.on('remove', this.remove, this);
    panZoom.on('change', this.move, this);     
    this.render();
  },

  // template : _.template("<iframe scrolling='no' src='<%= main %>'></iframe>"),
  template : _.template("<iframe scrolling='no' ></iframe>"),

  move: function(){
    this.$el.offset({
        top: panZoom.get('y')+this.model.get('y')+20,
        left: panZoom.get('x')+this.model.get('x')
    });
  },

  render: function(){
  
      this.$el.addClass('block').html(this.template(this.model.attributes)).appendTo($blockBox)
      this.$el.height(80);
      this.$el.width(100);
      this.$el.offset({top: this.model.get('y')+20, left: this.model.get('x')});
      // TODO http://jsfiddle.net/Th75t/7/
      // this.$el.resizable();
    
      var inner = this.$el.find('iframe')[0].contentWindow ;

      // rather than setting src=this.model.get('main'), to avoid cross origin restriction
      $.get( this.model.get('main'), function( pageHtml ) {
        inner.document.open();
        inner.document.writeln(pageHtml);
        inner.document.close();

        whenAvailable('main', inner, function(){ 
          console.log(inner.main)
        });

      });



      return this;
  } 
});

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

function plot(blocks){
    dot = container
      .selectAll("g")
      .data(blocks.models)
      .enter().append("g")
      .each(function(d,i){
        new SVGBlockView({ model: d, el: this});
        new BlockView({ model: d});
      });
}

var BlockModel = Backbone.Model.extend();

var BlockCollection = Backbone.Collection.extend({ 
  model: BlockModel,
}); 

var blocks = new BlockCollection();

blocks.fetch({
             url:'/graph/data/init.json', 
             success: function(collection){ plot(collection); } ,
             error: function(collection, response, options){ console.log("error loading graph"); },
            });

PanZoom = Backbone.Model.extend({
  defaults: {
    "x":  0,
    "y":  0,
  }
});

panZoom = new PanZoom;