// blocks or nodes
//=========================
var BlockModel = Backbone.Model.extend();

var BlockCollection = Backbone.Collection.extend({ 
  model: BlockModel,
}); 

var blocks = new BlockCollection(); 

$blockBox = $("<div id='blockBox'></div>").appendTo("#graphBox");


// $(document).ready(function(){
//           $blockBox.panzoom();
//           $blockBox.parent().on('mousewheel.focal', function( e ) {
//             e.preventDefault();
//             var delta = e.delta || e.originalEvent.wheelDelta;
//             var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
//             $blockBox.panzoom('zoom', zoomOut, {
//               increment: 0.1,
//               animate: false,
//               focal: e
//             });
//           });
// });


var BlockView = Backbone.View.extend({
  initialize: function(){
    this.model.on('change', this.render, this);      
    this.render();
  },
  template : _.template("<iframe src='<%= main %>'></iframe>"), //<iframe></iframe>
  events: {
    'click .remove' : function(){ this.destroy(); },

  },
  render: function(){
  
      this.$el.addClass('block').html(this.template(this.model.attributes)).appendTo($blockBox)
      this.$el.offset({top: this.model.get('y'), left: this.model.get('x')})
      return this;

    // var model = this.model;
    // var view = this;
    // var d3el = d3.select(this.el);
    // // d3el.append('iframe')
    // console.log(this.el)
    // this.$el.append('<iframe />', {src: this.model.get('main'), width:50,height:50})
    // this.$el.find('iframe').offset({top: this.model.get('y') ,left:this.model.get('x')})
      // .postition()
  } 
});




blocks.fetch({
               url:'/graph/data/init.json', 
               success: function(collection){ _.each(collection.models, function(model){ 
                  // $('#graphBox').append("<div class='block'></div>")
                  new BlockView({ model: model }) 

                }) } ,
               error: function(collection, response, options){ console.log("error loading graph"); },
            });

// new DivBlockView({ model: d, el: frame[0]});
 