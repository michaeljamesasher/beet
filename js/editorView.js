EditorView = Backbone.View.extend({
  initialize: function(){
    this.editor = ace.edit("editor");

    var language_tools = ace.require("ace/ext/language_tools");
    this.editor.setOptions({
          enableBasicAutocompletion: true,
          enableSnippets: true,
          enableLiveAutocomplete: false
    });

    this.editor.getSession().setMode("ace/mode/html");

    this.listenTo(this.model,'change',this.load)
  },
  load: function(){
    var model = blocks.get(this.model.get('blockId'));
    this.editor.setValue(model.get('pageHtml'));
    this.editor.clearSelection();

    if(this.model.previous('blockId')) this.unload(this.model.previous('blockId'));
    model.view.stopListening(panZoom,'change',model.view.move);
    model.view.stopListening(model,'change',model.view.move);

    // var menuBox = document.getElementById('menuBox');
    // menuBox.appendChild(model.view.el);

    // model.view.$el.css({top:0,left:'100%',width:'100%',height:'100%',
                        // position:'absolute','z-index':9});
    model.view.$el.css({left:'100%',width:'100%'});
    model.view.$el.addClass('selected'); // use !important in selected class or use model.view.$el.css
    _.each(blocks.models,function(m){ m.trigger('change'); });

    // block
  },
  unload: function(previousId){
    var model = blocks.get(previousId);
    model.view.$el.removeClass('selected')
    model.view.listenTo(panZoom,'change',model.view.move);
    model.view.listenTo(model,'change',model.view.move);
  }

})
var editorModel = new Backbone.Model();
new EditorView({model: editorModel})