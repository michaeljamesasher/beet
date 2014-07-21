


PanZoom = Backbone.Model.extend({
  defaults: {
    "x":  0,
    "y":  0,
    "zoom": 1,
  }
});
var panZoom = new PanZoom;

var blocks = new BlockCollection();

function addBlock(block){ // apparently shouldn't go in model.initialize http://stackoverflow.com/questions/15707444/do-you-initialize-your-backbone-views-from-within-a-model-or-elsewhere
    var d3el = container
      .append("g")
      .data([block])

    new SVGBlockView({ model: block, el: d3el[0][0] }).render();
    var view = new BlockView({ model: block, $el: block.get('iframeBox')}).render();
    return view;
}


  blocks.fetch({
             url:'/graph/data/init.json', 
             success: function(collection){ 

              var promises = [];
              _.each(collection.models, function(block){
                var view = addBlock(block);
                promises.push(view.promise);
              }); 

              // when all the blocks are loaded
              $.when.apply($,promises).done(function(){
                  sort_ids(collection.models);
                  _.each(collection.models, function(block){ 
                    // console.log('links are here', block.get('links')[0]);

                      var links = block.get('links');
                      _.each( links.models, function(link){

                        new LinkView({model: link});
                        // var linkModel = new Backbone.Model({
                        //   blockFrom: block,
                        //   blockTo: blocks.get(link.id),
                        //   inputTo: link.input
                        // }); 
                        // new LinkView({model: linkModel})
                      });

                  });
              });

            },
             error: function(collection, response, options){ console.log("error loading graph"); },
            });

  setTimeout(function(){
    var block = new BlockModel({"x": 280, "y":400, "main": "/graph/pages/handsontable.html"});
    blocks.add(block);
    addBlock(block);

  }, 1000); // fetch resets the collection

  // addBlock({ "x": 100, "y":280, "main": "/graph/pages/jquery-ui-slider.html"});
  // addBlock({ "x": 280, "y":280, "main": "/graph/pages/js.html"});


// use listenTo rather than model.on  // check ozkatz.github.io/avoiding-common-backbonejs-pitfalls.html