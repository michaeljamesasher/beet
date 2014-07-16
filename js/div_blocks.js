var BlockModel = Backbone.Model.extend();

var BlockCollection = Backbone.Collection.extend({ 
  model: BlockModel,
}); 

var DivBlockView = Backbone.View.extend({
  initialize: function(){
    this.model.on('change', this.render, this);      
    this.render();
  },
  render: function(){
    var model = this.model;
    var view = this;
    var d3el = d3.select(this.el);
    // d3el.append('iframe')
    console.log(this.el)
    this.$el.append('<iframe />', {src: this.model.get('main'), width:50,height:50})
    this.$el.find('iframe').offset({top: this.model.get('y') ,left:this.model.get('x')})
      // .postition()

  }
});


var SVGBlockView = Backbone.View.extend({
  initialize: function(){
    // this.model.on('change', this.render, this);      
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
      .attr("width", 50)
      .attr("height", 50);

    d3el.selectAll('text').remove();
    d3el.append('text')
      .text('X')
      .attr('class','remove');
      // .on('click', function(){ view.destroy(); });

    // var main = parseMain(model.get('main'));
    var main = ['hello', 'you', 'yere'];

// selection.node().getBBox()
    // d3el.selectAll('.input').remove();

    // d3el.selectAll('.input')
    //   .data(main)
    //   .enter()
    //   .append('foreignObject')
    //   .attr('width','200').attr('height','200')
    //   .attr('class','input').html('<iframe src="/graph/pages/slider.html" width="200" height="200"></iframe>')
      // .append('g').attr('class','input')
      // .attr("transform", function(d,i) { return 'translate(' + 0 +',' + (i+1)*(40/main.length) + ')'; })
      // .append('text').text(function(d){return d;})

  },

  destroy : function(){
    blocks.remove(this.model);
    this.remove();
  }
});

function parseMain(pageUrl){
    var $div = $("<div>", {id: 'junk'});
    $.get( pageUrl, function( pageHtml ) {
      var gistFrame = document.createElement("iframe");
      // gistFrame.setAttribute("width", "100%");
      // gistFrame.setAttribute("height", "100%");
      // gistFrame.setAttribute("frameborder", "0");
      // gistFrame.setAttribute("style", "border: 0px;");
      // gistFrame.id = "gistFrame";

      // var zone = document.getElementById(divId);
      // zone.innerHTML = "";
      // zone.appendChild(gistFrame);

      var gistFrameDoc = gistFrame.document;
      if (gistFrame.contentDocument) {
            gistFrameDoc = gistFrame.contentDocument;
          } else if (gistFrame.contentWindow) {
            gistFrameDoc = gistFrame.contentWindow.document;
      }
      gistFrameDoc.open();
      gistFrameDoc.writeln(pageHtml);
      gistFrameDoc.close();
      console.log(gistFrameDoc)
      // $div.remove();
      return ['hello', 'you', 'yere']

  }); 
}






var blocks = new BlockCollection();

blocks.fetch({
             url:'/graph/data/init.json', 
             success: function(collection){ plot(collection); } ,
             error: function(collection, response, options){ console.log("error loading graph"); },
            });
