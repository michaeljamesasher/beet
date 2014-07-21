// helper functions
//=======================================

// thanks http://www.mattsnider.com/parsing-javascript-function-argument-names/
function getParamNames(fn) {
    var funStr = fn.toString();
    return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
}

//thanks to http://stackoverflow.com/questions/8618464/how-to-wait-for-another-js-to-load-to-proceed-operation
// _.defer didn't always work
function whenAvailable(name, context, callback) {
    var dfd = new $.Deferred();
    var interval = 100; // ms
    function callUntil(){
      if (context[name]) {
            callback();
            dfd.resolve();
            // callback(window[name]);
        } else {
            setTimeout(callUntil, interval);
        }
    }
    setTimeout(callUntil, interval);
    return dfd.promise();
}

// sort _id   
function sort_ids(models){
  _.each(models,function(model){
    var savedLinks = model.get('savedLinks') || [];
    for (var i = 0; i < savedLinks.length; i++) {
      _.each(models,function(otherModel){
        if (savedLinks[i].toId == otherModel.get('_id')){
          savedLinks[i].toId = otherModel.cid;
        }
      });
      savedLinks[i].fromId = model.cid;
    };
    // model.set('savedLinks',savedLinks); // TODO linkmodel with view
    model.unset('savedLinks',{silent:true})
    model.get('links').add(savedLinks)
    // model.set('links', new Backbone.Collection(links));
  });
}


// initialize models and views
//=======================================
// _id, inputs, output, links, x, y, main, inputValues 
var BlockModel = Backbone.Model.extend({
  initialize: function(){
    this.on('change:output', this.followLinks, this);
    this.set('inputValues', new Backbone.Model());
    this.set('links', new Backbone.Collection());
  },
  followLinks: function(){
    var output = this.get('output');
    var links = this.get('links');
    _.each(links.models,function(link){
      var inputValues = blocks.get(link.get('toId')).get('inputValues');
      inputValues.set(link.get('input'),output);
    });
  },
  // format for saving
  toJSON: function() {
    var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
    json._id = this.cid;
    // TODO links collection
    return json;
  },
});

var BlockCollection = Backbone.Collection.extend({ 
  model: BlockModel,
}); 


// underlying SVG for block
//=======================================

var SVGBlockView = Backbone.View.extend({
  initialize: function(){
    this.model.SVGView = this;
    this.model.on('change', this.render, this);   // TODO only necessary for inputs  
    this.model.on('remove', this.remove, this);      
  },
  events: {
    'click .remove' : function(){ this.destroy(); },
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
        .attr("height", 100)
        .on('click',function(){
          // if selected
          editorModel.set('blockId', model.cid);
        });
    }

    d3el.selectAll('text').remove();
    d3el.append('text')
      .attr('font-family', 'beet')
      .attr('font-size', function(d) { return 25; } )
      .attr("transform", 'translate(90,10)')
      .text(function(d) { return '' })
      .attr('class','remove')
      .attr('cursor','default'); // TODO create undo button
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
            // .attr('cursor','crosshair')
            .on('mouseenter', function(d,i){
              linkEnd={toId:model.cid,input: d};
            })
            .on('mouseleave',function(){
              linkEnd=null; // TODO will reseting this get rid of model, allow it to be removed
            });

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
    .datum(model)
    // .datum({x:model.get('x')+100,y:model.get('y')+32})
    .attr("transform", function(d,i) { 
      return 'translate(100 , 32)'; 
    })
    .attr('cursor','crosshair')
    .call(dragLink)
    // .on("mousedown", function(d){ d3.event.stopPropagation();  })
    .append('circle').attr('r',10);
  },

  destroy : function(){
    blocks.remove(this.model);
    _.each(blocks.models,function(m){ m.trigger('change'); }); // hack to stop iframes jumping around
  }
});

// iframe for block
//=======================================

var BlockView = Backbone.View.extend({
  initialize: function(){
    this.model.view = this;
    this.model.on('remove', this.remove, this);     // TODO change to listenTO
    this.listenTo(panZoom,'change', this.move)
    this.listenTo(this.model,'change', this.move)

  },
  move: function(){
    this.$el.offset({
        top: panZoom.get('y')+(this.model.get('y')+20)*panZoom.get('zoom'),
        left: panZoom.get('x')+(this.model.get('x'))*panZoom.get('zoom')
    });
    this.$el.height(80*panZoom.get('zoom'));
    this.$el.width(100*panZoom.get('zoom'));

  },
  render: function(){
      var model = this.model;
      this.$el.addClass('block').html('<iframe ></iframe>').appendTo($blockBox)
      this.move(); // TODO render->initialize, move->render?
      // TODO http://jsfiddle.net/Th75t/7/ this.$el.resizable();

      var inner = this.$el.find('iframe')[0].contentWindow;

      var $html = this.$el.find('iframe').contents().find('html');

      // junk iframe just to find how many arguments main has/had
      var junkIframe = $('<iframe />').appendTo('#junkIframes');
      var innerJunk = junkIframe[0].contentWindow;
      // promise will only resolve when below $.get completes and main is in context innerJunk
      this.promise = whenAvailable('main', innerJunk, function(){
          model.set('inputs', getParamNames(innerJunk.main) ); 
          junkIframe.remove();
      });

      // get iframe
      // rather than setting src=this.model.get('main'), to avoid cross origin restriction
      $.get( this.model.get('main'), function( pageHtml ) {   
            
        model.set('pageHtml', pageHtml);    
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

        innerJunk.document.open();
        innerJunk.document.writeln(pageHtml);
        innerJunk.document.close();
      
      });

      return this;
  } 
});

var LinkView = Backbone.View.extend({
  initialize: function(){
    this.model.view = this;
    // var blockTo = this.model.get('blockTo');
    var blockFrom = blocks.get(this.model.get('fromId'));
    var blockTo = blocks.get(this.model.get('toId'));
    this.listenTo(blockFrom, 'change',this.render);
    this.listenTo(blockTo, 'change',this.render);
    this.listenTo(blockTo, 'remove',this.destroy);
    this.listenTo(blockFrom, 'remove',this.destroy);
    
    this.d3Link = container
      .insert('path',":first-child")
      .datum(this.model)
      .attr('class','link')
      .attr('cursor','crosshair')
      .call(redragLink);

    this.render();

  },
  destroy: function(){
    this.d3Link.remove();
    this.remove();
  },
  render: function(){
    //TODO stop calling when undefined
    var blockFrom = blocks.get(this.model.get('fromId'));
    var blockTo = blocks.get(this.model.get('toId'));
    var inputTo = this.model.get('input');

    this.d3Link 
    .attr('d', function(d){
      // TODO don't hardcode path? - have BlockModel.inputPosition()
      var yTo = blockTo.get('y') + 30 +32*_.indexOf(blockTo.get('inputs'),inputTo);
      var path = drawLinkPath(blockFrom.get('x')+100, blockFrom.get('y')+32,
                              blockTo.get('x'), yTo )
      return path;
    });

  }
});