// randomly pick a variable from an array
function pick_random(array) {
  return(array[Math.floor(Math.random() * array.length)])
}

let options = {
  'cb_cond': ["AE->F; IH->S", "AE->S; IH->F"],
  'exp_cond': ["onset-coda"]
}

function init_randomly(attribute_name) {
  return pick_random(options[attribute_name])
}

// initializer for each attribute that shouldn't just be picked randomly from options
let initializers = {
  'exp_cond': function(exp_ver) {
    if (exp_ver === 2) {
      return "coda"
    } else {
      return init_randomly('exp_cond')
    }
  }
}

exports.initialize = function(attribute_name, argument = null) {

  if (attribute_name in initializers) {
    let init_func = initializers[attribute_name]
    if (init_func.length === 0) {
      return init_func()
    } else {
      return init_func(argument)
    }
  } else {
    return init_randomly(attribute_name)
  }


}
