// thanks to http://underscorejs.org
//TODO namespace
var beet = {};
beet.slice = Array.prototype.slice;
beet.partial = function(func) {
  var boundArgs = beet.slice.call(arguments, 1);
  return function() {
    var position = 0;
    var args = boundArgs.slice();
    for (var i = 0, length = args.length; i < length; i++) {
    }
    while (position < arguments.length) args.push(arguments[position++]);
    return func.apply(this, args);
  };
};
beet.wrap = function(func, wrapper) {
  return beet.partial(wrapper, func);
};
main = beet.wrap(main, function(func) {
  try{
      var model = parent.blocks.get('<%= id %>');
      var inputs = model.get('inputs') || [];
      var inputValues = model.get('inputValues') || [];
      var output = func.apply(this,inputs.map(function(input){ return inputValues.get(input) }));
      // console.log("<%= id %>", output, inputs.map(function(input){ return inputValues.get(input) }))
      model.set("output", output);
      return output;
  }
  catch(err){
    console.log(err + 'in block <%= id %>');
  }
});
parent.blocks.get('<%= id %>').get('inputValues').on('change',main);
