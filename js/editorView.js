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
    // this.unload(this.model.previous('blockId'));
    this.unload(this.model.previous('blockId'));

    var model = blocks.get(this.model.get('blockId'));

    this.editor.setValue(model.get('pageHtml'));
    this.editor.focus();
    this.editor.gotoLine(0);
    // this.editor.resize()
    // this.editor.clearSelection();



    model.view.stopListening(panZoom,'change',model.view.move);
    model.view.stopListening(model,'change',model.view.move);

    // var menuBox = document.getElementById('menuBox');
    // menuBox.appendChild(model.view.el);

    // model.view.$el.css({top:0,left:'100%',width:'100%',height:'100%',
                        // position:'absolute','z-index':9});

    model.view.$el.css({left:$menuBox.css('left'),width:$menuBox.css('width') }); // '100%'
    model.view.$el.addClass('selected'); // use !important in selected class or use model.view.$el.css
    _.each(blocks.models,function(m){ m.trigger('change'); });

    // block
  },
  unload: function(previousId){
    // var previousId = this.model.previous('blockId');
    if(previousId) {   
      this.editor.setValue('');
      var model = blocks.get(previousId);
      // console.log( model.view.$el.css('left'))
      model.view.$el.removeClass('selected')
      model.view.listenTo(panZoom,'change',model.view.move);
      model.view.listenTo(model,'change',model.view.move);
      _.each(blocks.models,function(m){ m.trigger('change'); });
    }
  }

})
var $menuBox = $('#menuBox');
var editorModel = new Backbone.Model();
var editorView = new EditorView({model: editorModel})
rect.on('click',function(){
  editorView.unload(editorModel.get('blockId'));
})

$(document).ready(function(){
  $('#editor').hide();
});

// explorer js console block which get's frame is input?

// TODO bug with reselected block after deselection