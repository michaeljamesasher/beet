// thanks http://www.mattsnider.com/parsing-javascript-function-argument-names/
function getParamNames(fn) {
    var funStr = fn.toString();
    return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
}

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
  // template : _.template("<iframe scrolling='no' ></iframe>"),
  template : _.template("<iframe ></iframe>"),

  move: function(){
    this.$el.offset({
        top: panZoom.get('y')+this.model.get('y')+20,
        left: panZoom.get('x')+this.model.get('x')
    });
  },


        // TODO 1. call main when inputs change

  render: function(){
      var model = this.model;

      this.$el.addClass('block').html(this.template(this.model.attributes)).appendTo($blockBox)
      this.$el.height(80);
      this.$el.width(100);
      this.$el.offset({top: this.model.get('y')+20, left: this.model.get('x')});
      // TODO http://jsfiddle.net/Th75t/7/
      // this.$el.resizable();
    
      var inner = this.$el.find('iframe')[0].contentWindow;

      var $html = this.$el.find('iframe').contents().find('html');

      // rather than setting src=this.model.get('main'), to avoid cross origin restriction
      $.get( this.model.get('main'), function( pageHtml ) {
        
              
            
        // add in wrapping script to let parent know when main is called in iframe
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


        // inner.document.innerHTML = newHtml;

        // junk iframe just to find how many arguments main has/had
        var junkIframe = $('<iframe />').appendTo('#junkIframes');
        var innerJunk = junkIframe[0].contentWindow;
        innerJunk.document.open();
        innerJunk.document.writeln(pageHtml);
        innerJunk.document.close();



        whenAvailable('main', innerJunk, function(){

          model.set('inputs', getParamNames(innerJunk.main) ); 
          // inner.document.innerHTML = newHtml;
          // $html.html(newHtml);

          // thanks to http://ntt.cc/2008/02/10/4-ways-to-dynamically-load-external-javascriptwith-source.html
          // var oHead = inner.document.getElementsByTagName('body').item(0);
          // // TODO can't find body element 
          // // TODDO can't find main function
          // var oScript = inner.document.createElement( "script" );
          // oScript.language = "javascript";
          // oScript.type = "text/javascript";
          // // oScript.id = sId;
          // // oScript.defer = true;
          // // oScript.text = 'main = function(){ var model = parent.blocks.get(' + model.id + ');'
          // //           +'var output = main(arguments);'
          // //           +'model.set("output",output);'
          // //           +'console.log(parent.blocks); return output; }';
          // oScript.text = _.template($('#wrapMain').html())({
          //                                             id: model.cid,
          //                                             open: '',
          //                                             close: '',
          //                                                 });

          // oHead.appendChild( oScript );

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

var BlockModel = Backbone.Model.extend();

var BlockCollection = Backbone.Collection.extend({ 
  model: BlockModel,
}); 

var blocks = new BlockCollection();



// function addBlock(data){
//   // var block = blocks.add(data).models[0];

//   var block = new BlockModel(data);
//   var el = container.append('g')[0][0];
//   new SVGBlockView({ model: block, el: el});
//   // new BlockView({ model: block});

// }

function plot(blocks){
    dot = container
      .selectAll("g")
      .data(blocks.models)
      .enter().append("g")
      .each(function(d,i){
        // console.log("plot", d, this)
        new SVGBlockView({ model: d, el: this});
        new BlockView({ model: d});
      });
}


PanZoom = Backbone.Model.extend({
  defaults: {
    "x":  0,
    "y":  0,
  }
});

var panZoom = new PanZoom;

$(document).ready(function(){
// setTimeout(function(){

  blocks.fetch({
             url:'/graph/data/init.json', 
             success: function(collection){ plot(collection); } ,
             error: function(collection, response, options){ console.log("error loading graph"); },
            });
  // addBlock({"id": "number4", "x": 200, "y":200, "main": "/graph/pages/jquery-ui-slider.html"});
  // addBlock({"id": "number1", "x": 280, "y":100, "main": "/graph/pages/jquery-ui-slider.html"});
  // addBlock({"id": "number3", "x": 100, "y":280, "main": "/graph/pages/js.html"});
})
// },3000);